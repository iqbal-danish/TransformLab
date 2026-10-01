package com.transformlab.engine;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.util.*;
import javax.xml.transform.Source;
import javax.xml.transform.stream.StreamSource;

// Saxon S9API
import net.sf.saxon.s9api.*;

// JOLT & Jackson
import com.bazaarvoice.jolt.Chainr;
import com.bazaarvoice.jolt.JsonUtils;
import com.bazaarvoice.jolt.exception.JoltException;
import com.bazaarvoice.jolt.exception.SpecException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;

public class TransformEngineWorker {

    private static final ObjectMapper MAPPER = new ObjectMapper().enable(SerializationFeature.INDENT_OUTPUT);

    public static void main(String[] args) {
        System.setProperty("jdk.xml.maxGeneralEntitySizeLimit", "0");
        System.setProperty("jdk.xml.totalEntitySizeLimit", "0");
        System.setProperty("jdk.xml.entityExpansionLimit", "0");
        System.setProperty("jdk.xml.maxXMLNameLimit", "0");
        System.setProperty("jdk.xml.elementAttributeLimit", "0");
        System.setProperty("jdk.xml.maxOccurLimit", "0");
        System.setProperty("jdk.xml.xpathExprGrpLimit", "0");
        System.setProperty("jdk.xml.xpathExprOpLimit", "0");
        System.setProperty("jdk.xml.xpathTotalOpLimit", "0");
        System.setProperty("entityExpansionLimit", "0");

        if (args.length < 1) {
            System.err.println("Usage: TransformEngineWorker <request-json-path-or-inline>");
            System.exit(1);
        }

        try {
            String requestJson;
            File reqFile = new File(args[0]);
            if (reqFile.exists()) {
                requestJson = Files.readString(reqFile.toPath(), StandardCharsets.UTF_8);
            } else {
                requestJson = args[0];
            }

            @SuppressWarnings("unchecked")
            Map<String, Object> req = MAPPER.readValue(requestJson, Map.class);
            Map<String, Object> result = processRequest(req);
            System.out.println(MAPPER.writeValueAsString(result));

        } catch (Throwable t) {
            Map<String, Object> errResp = new HashMap<>();
            errResp.put("status", "error");
            Map<String, Object> err = new HashMap<>();
            err.put("category", "Engine");
            err.put("message", t.getMessage() != null ? t.getMessage() : t.toString());
            err.put("rawError", getStackTrace(t));
            errResp.put("error", err);
            try {
                System.out.println(MAPPER.writeValueAsString(errResp));
            } catch (Exception e) {
                System.out.println("{\"status\":\"error\",\"error\":{\"message\":\"" + escapeJson(t.getMessage()) + "\"}}");
            }
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> processRequest(Map<String, Object> req) {
        String engine = (String) req.getOrDefault("engine", "xslt");
        String inputPath = (String) req.get("inputPath");
        String outputPath = (String) req.get("outputPath");
        String transformContent = (String) req.get("transformContent");
        String transformPath = (String) req.get("transformPath");
        List<Map<String, Object>> parameters = (List<Map<String, Object>>) req.get("parameters");

        long start = System.currentTimeMillis();

        if ("xslt".equalsIgnoreCase(engine)) {
            return runXslt(inputPath, outputPath, transformContent, transformPath, parameters, start);
        } else if ("jolt".equalsIgnoreCase(engine)) {
            return runJolt(inputPath, outputPath, transformContent, transformPath, parameters, start);
        } else {
            Map<String, Object> resp = new HashMap<>();
            resp.put("status", "error");
            Map<String, Object> err = new HashMap<>();
            err.put("category", "Application");
            err.put("message", "Unsupported engine: " + engine);
            resp.put("error", err);
            return resp;
        }
    }

    private static Map<String, Object> runXslt(
            String inputPath,
            String outputPath,
            String transformContent,
            String transformPath,
            List<Map<String, Object>> parameters,
            long startTime
    ) {
        Map<String, Object> resp = new HashMap<>();
        Processor processor = new Processor(false); // Saxon-HE
        try {
            processor.setConfigurationProperty("http://saxon.sf.net/feature/entityExpansionLimit", 0);
        } catch (Exception ignore) {}

        List<XmlProcessingError> errorList = new ArrayList<>();

        try {
            XsltCompiler compiler = processor.newXsltCompiler();
            compiler.setErrorList(errorList);

            Source stylesheetSource;
            if (transformContent != null && !transformContent.trim().isEmpty()) {
                stylesheetSource = new StreamSource(new StringReader(transformContent));
            } else if (transformPath != null && !transformPath.trim().isEmpty()) {
                stylesheetSource = new StreamSource(new File(transformPath));
            } else {
                throw new IllegalArgumentException("No XSLT stylesheet provided.");
            }

            XsltExecutable executable;
            try {
                executable = compiler.compile(stylesheetSource);
            } catch (SaxonApiException e) {
                resp.put("status", "error");
                resp.put("error", convertSaxonErrors(errorList, e));
                return resp;
            }

            Xslt30Transformer transformer = executable.load30();
            transformer.setErrorReporter(err -> errorList.add(err));


            // Apply parameters
            if (parameters != null) {
                Map<QName, XdmValue> paramMap = new HashMap<>();
                for (Map<String, Object> p : parameters) {
                    String name = (String) p.get("name");
                    Object val = p.get("value");
                    String type = (String) p.getOrDefault("type", "string");
                    if (name != null && val != null) {
                        QName qName = new QName(name);
                        XdmValue xdmVal;
                        if ("number".equalsIgnoreCase(type)) {
                            try {
                                xdmVal = new XdmAtomicValue(Double.parseDouble(val.toString()));
                            } catch (Exception ex) {
                                xdmVal = new XdmAtomicValue(val.toString());
                            }
                        } else if ("boolean".equalsIgnoreCase(type)) {
                            xdmVal = new XdmAtomicValue(Boolean.parseBoolean(val.toString()));
                        } else {
                            xdmVal = new XdmAtomicValue(val.toString());
                        }
                        paramMap.put(qName, xdmVal);
                    }
                }
                transformer.setStylesheetParameters(paramMap);
            }

            File outFile = new File(outputPath);
            if (outFile.getParentFile() != null) {
                outFile.getParentFile().mkdirs();
            }

            Serializer serializer = processor.newSerializer(outFile);
            serializer.setOutputProperty(Serializer.Property.METHOD, "xml");
            serializer.setOutputProperty(Serializer.Property.INDENT, "yes");

            Source inputSource = new StreamSource(new File(inputPath));
            transformer.applyTemplates(inputSource, serializer);

            long elapsed = System.currentTimeMillis() - startTime;
            long outputSize = outFile.length();

            resp.put("status", "success");
            resp.put("executionTimeMs", elapsed);
            resp.put("outputSizeBytes", outputSize);
            resp.put("outputPath", outputPath);
            return resp;

        } catch (Throwable t) {
            resp.put("status", "error");
            resp.put("error", convertSaxonErrors(errorList, t));
            return resp;
        }
    }

    @SuppressWarnings("unchecked")
    private static Map<String, Object> runJolt(
            String inputPath,
            String outputPath,
            String transformContent,
            String transformPath,
            List<Map<String, Object>> parameters,
            long startTime
    ) {
        Map<String, Object> resp = new HashMap<>();

        try {
            Object specJson;
            if (transformContent != null && !transformContent.trim().isEmpty()) {
                specJson = JsonUtils.jsonToObject(transformContent);
            } else if (transformPath != null && !transformPath.trim().isEmpty()) {
                specJson = JsonUtils.filepathToObject(transformPath);
            } else {
                throw new IllegalArgumentException("No JOLT spec provided.");
            }

            Chainr chainr;
            try {
                chainr = Chainr.fromSpec(specJson);
            } catch (SpecException se) {
                resp.put("status", "error");
                Map<String, Object> err = new HashMap<>();
                err.put("category", "Engine");
                err.put("code", "SpecException");
                err.put("message", se.getMessage());
                err.put("rawError", getStackTrace(se));
                resp.put("error", err);
                return resp;
            }

            Object inputJson = JsonUtils.filepathToObject(inputPath);

            Map<String, Object> context = new HashMap<>();
            if (parameters != null) {
                for (Map<String, Object> p : parameters) {
                    String name = (String) p.get("name");
                    Object val = p.get("value");
                    if (name != null) {
                        context.put(name, val);
                    }
                }
            }

            Object transformed = chainr.transform(inputJson, context);

            File outFile = new File(outputPath);
            if (outFile.getParentFile() != null) {
                outFile.getParentFile().mkdirs();
            }

            try (Writer writer = new OutputStreamWriter(new FileOutputStream(outFile), StandardCharsets.UTF_8)) {
                writer.write(JsonUtils.toPrettyJsonString(transformed));
            }

            long elapsed = System.currentTimeMillis() - startTime;
            long outputSize = outFile.length();

            resp.put("status", "success");
            resp.put("executionTimeMs", elapsed);
            resp.put("outputSizeBytes", outputSize);
            resp.put("outputPath", outputPath);
            return resp;

        } catch (JoltException je) {
            resp.put("status", "error");
            Map<String, Object> err = new HashMap<>();
            err.put("category", "Engine");
            err.put("code", je.getClass().getSimpleName());
            err.put("message", je.getMessage());
            err.put("rawError", getStackTrace(je));
            resp.put("error", err);
            return resp;
        } catch (Throwable t) {
            resp.put("status", "error");
            Map<String, Object> err = new HashMap<>();
            err.put("category", "Engine");
            err.put("code", t.getClass().getSimpleName());
            err.put("message", t.getMessage() != null ? t.getMessage() : t.toString());
            err.put("rawError", getStackTrace(t));
            resp.put("error", err);
            return resp;
        }
    }

    private static Map<String, Object> convertSaxonErrors(List<XmlProcessingError> errorList, Throwable fallback) {
        if (!errorList.isEmpty()) {
            XmlProcessingError pe = errorList.get(0);
            Map<String, Object> err = new HashMap<>();
            err.put("category", "Engine");
            if (pe.getErrorCode() != null) {
                err.put("code", pe.getErrorCode().getLocalName());
            }
            err.put("message", pe.getMessage());
            if (pe.getLocation() != null) {
                int line = pe.getLocation().getLineNumber();
                int col = pe.getLocation().getColumnNumber();
                String sysId = pe.getLocation().getSystemId();
                if (line > 0) err.put("line", line);
                if (col > 0) err.put("column", col);
                if (sysId != null && !sysId.isEmpty()) err.put("file", sysId);
            }
            if (pe.getFailingExpression() != null) {
                err.put("contextSnippet", pe.getFailingExpression().toString());
            }
            if (pe.getCause() != null) {
                err.put("nestedCause", pe.getCause().getMessage());
            }
            err.put("rawError", getStackTrace(fallback));
            return err;
        }

        Map<String, Object> err = new HashMap<>();
        err.put("category", "Engine");
        err.put("message", fallback.getMessage() != null ? fallback.getMessage() : fallback.toString());

        if (fallback instanceof SaxonApiException) {
            SaxonApiException sae = (SaxonApiException) fallback;
            if (sae.getErrorCode() != null) {
                err.put("code", sae.getErrorCode().getLocalName());
            }
            if (sae.getLineNumber() > 0) {
                err.put("line", sae.getLineNumber());
            }
            if (sae.getSystemId() != null) {
                err.put("file", sae.getSystemId());
            }
        }

        err.put("rawError", getStackTrace(fallback));
        return err;
    }

    private static String getStackTrace(Throwable t) {
        if (t == null) return "";
        StringWriter sw = new StringWriter();
        PrintWriter pw = new PrintWriter(sw);
        t.printStackTrace(pw);
        return sw.toString();
    }

    private static String escapeJson(String s) {
        if (s == null) return "";
        return s.replace("\\", "\\\\").replace("\"", "\\\"").replace("\n", "\\n").replace("\r", "\\r");
    }
}
