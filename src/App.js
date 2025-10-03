import React, { useState, useEffect, useCallback } from "react";
import {
    FaTrashAlt,
    FaPlus,
    FaFileImport,
    FaDownload,
    FaWpforms,
    FaFileCode,
    FaFileAlt,
    FaCheck
} from "react-icons/fa";
import { SiYaml } from "react-icons/si";

const backendUrl = "http://localhost:8080";

function parseHTTPRequest(text) {
    const lines = text.split(/\r?\n/);
    let i = 0;
    while (i < lines.length && lines[i].trim() === "") i++;
    if (i >= lines.length) return null;

    const requestLine = lines[i++].trim();
    const parts = requestLine.split(" ");
    if (parts.length < 3) return null;

    const method = parts[0];
    const requestURI = parts[1];
    const headers = {};

    for (; i < lines.length; i++) {
        const line = lines[i];
        if (line.trim() === "") {
            i++;
            break;
        }
        const colonIndex = line.indexOf(":");
        if (colonIndex !== -1) {
            const key = line.substring(0, colonIndex).trim();
            const value = line.substring(colonIndex + 1).trim();
            headers[key] = value;
        }
    }

    const body = lines.slice(i).join("\n").trim();
    let url = requestURI;
    if (headers["Host"]) {
        url = "http://" + headers["Host"] + requestURI;
    }

    return { method, url, headers, body, name: "transaction name" };
}

function HeaderRow({ transactionIndex, headerKey, headerValue, updateHeaderKey, updateHeaderValue, removeHeader }) {
    return (
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
            <input
                type="text"
                placeholder="Header Name"
                value={headerKey}
                onChange={(e) => updateHeaderKey(transactionIndex, headerKey, e.target.value)}
                style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", width: "40%" }}
            />
            <input
                type="text"
                placeholder="Header Value"
                value={headerValue}
                onChange={(e) => updateHeaderValue(transactionIndex, headerKey, e.target.value)}
                style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", width: "40%" }}
            />
            <button
                type="button"
                onClick={() => removeHeader(transactionIndex, headerKey)}
                style={{
                    backgroundColor: "#ef4444",
                    color: "#fff",
                    padding: "4px 8px",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                <FaTrashAlt style={{ marginRight: "4px" }} /> Remove
            </button>
        </div>
    );
}

function FileRow({ fileIndex, fileData, updateFile, removeFile }) {
    const [localColumnNames, setLocalColumnNames] = useState(fileData.column_names.join(", "));

    useEffect(() => {
        setLocalColumnNames(fileData.column_names.join(", "));
    }, [fileData.column_names]);

    const parametersUsed = fileData.column_names
        .map((col) => `\${${fileData.name}.${col}}`)
        .join(", ");

    return (
        <div style={{ marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                <input
                    type="text"
                    placeholder="Parameter name"
                    value={fileData.name}
                    onChange={(e) => updateFile(fileIndex, "name", e.target.value)}
                    style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", width: "20%" }}
                />
                <input
                    type="text"
                    placeholder="Column Names (comma separated)"
                    value={localColumnNames}
                    onChange={(e) => setLocalColumnNames(e.target.value)}
                    onBlur={() => updateFile(fileIndex, "column_names", localColumnNames)}
                    style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", width: "40%" }}
                />
                <input
                    type="text"
                    placeholder="filename"
                    value={fileData.path}
                    onChange={(e) => updateFile(fileIndex, "path", e.target.value)}
                    style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", width: "20%" }}
                />
                <button
                    type="button"
                    onClick={() => removeFile(fileIndex)}
                    style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        padding: "4px 8px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <FaTrashAlt style={{ marginRight: "4px" }} /> Remove File
                </button>
            </div>
            <div style={{ marginTop: "4px" }}>
                <label style={{ fontSize: "0.75rem", fontWeight: "500", marginBottom: "2px", display: "block" }}>
                    Parameter to be used
                </label>
                <input
                    type="text"
                    readOnly
                    value={parametersUsed}
                    style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", backgroundColor: "#eee", width: "100%" }}
                />
            </div>
        </div>
    );
}

function TransactionRow({
                            transaction,
                            tIndex,
                            handleChange,
                            removeTransaction,
                            updateHeaderKey,
                            updateHeaderValue,
                            removeHeader,
                            addHeader,
                            addExtractor,
                            removeExtractor,
                            updateTransaction,
                        }) {
    const [showImportField, setShowImportField] = useState(false);
    const [importText, setImportText] = useState("");
    const [importCompleted, setImportCompleted] = useState(false);
    const [isImporting, setIsImporting] = useState(false);

    const handleImportSubmit = async () => {
        setIsImporting(true);
        try {
            const response = await fetch(`${backendUrl}/convertHTTP`, {
                method: "POST",
                headers: { "Content-Type": "text/plain" },
                body: importText,
            });
            const text = (await response.text()).trim();

            if (!text) {
                alert("Empty response from convertHTTP endpoint");
                return;
            }

            let data;
            if (text.startsWith("{")) {
                try {
                    data = JSON.parse(text);
                } catch (jsonErr) {
                    console.error("JSON parse error:", jsonErr);
                    alert("Could not parse JSON response: " + text);
                    return;
                }
            } else {
                data = parseHTTPRequest(text);
                if (!data) {
                    alert("Could not parse HTTP request from response: " + text);
                    return;
                }
            }

            updateTransaction(tIndex, { ...transaction, ...data });
            setShowImportField(false);
            setImportText("");
            setImportCompleted(true);
        } catch (error) {
            console.error("Error converting HTTP request:", error);
            alert("Error converting HTTP request: " + error.message);
        } finally {
            setIsImporting(false);
        }
    };

    return (
        <div style={{ marginBottom: "12px", width: "100%" }}>
            <div style={{ marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={() => removeTransaction(tIndex)}
                    style={{
                        backgroundColor: "#ef4444",
                        color: "#fff",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <FaTrashAlt style={{ marginRight: "4px" }} /> Remove Transaction {tIndex + 1}
                </button>
                {!importCompleted && (
                    <button
                        type="button"
                        onClick={() => setShowImportField(!showImportField)}
                        style={{
                            backgroundColor: "#6b7280",
                            color: "#fff",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <FaFileImport style={{ marginRight: "4px" }} /> Import HTTP Request
                    </button>
                )}
            </div>

            {showImportField && !importCompleted && (
                <div style={{ marginBottom: "8px" }}>
                    <textarea
                        placeholder="Paste HTTP request here"
                        value={importText}
                        onChange={(e) => setImportText(e.target.value)}
                        style={{
                            width: "100%",
                            height: "100px",
                            border: "1px solid #ccc",
                            padding: "8px",
                            borderRadius: "4px",
                            marginBottom: "8px",
                        }}
                    />
                    <button
                        type="button"
                        onClick={handleImportSubmit}
                        disabled={isImporting}
                        style={{
                            backgroundColor: isImporting ? "#9ca3af" : "#10b981",
                            color: "#fff",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            cursor: isImporting ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            opacity: isImporting ? 0.6 : 1
                        }}
                    >
                        <FaPlus style={{ marginRight: "4px" }} /> {isImporting ? "Importing..." : "Submit"}
                    </button>
                </div>
            )}

            <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                    name
                </label>
                <input
                    type="text"
                    value={transaction.name}
                    onChange={(e) => handleChange(e, "name", tIndex)}
                    style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px" }}
                />
            </div>

            <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                    url
                </label>
                <input
                    type="text"
                    value={transaction.url}
                    onChange={(e) => handleChange(e, "url", tIndex)}
                    style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px" }}
                />
            </div>

            <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                    assertion
                </label>
                <input
                    type="text"
                    value={transaction.assertion || ""}
                    onChange={(e) => handleChange(e, "assertion", tIndex)}
                    style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px" }}
                />
            </div>

            <div style={{ marginBottom: "8px" }}>
                <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                    method
                </label>
                <select
                    value={transaction.method}
                    onChange={(e) => handleChange(e, "method", tIndex)}
                    style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px" }}
                >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="DELETE">DELETE</option>
                    <option value="PATCH">PATCH</option>
                </select>
            </div>

            {["POST", "PUT", "PATCH"].includes(transaction.method) && (
                <div style={{ marginBottom: "8px" }}>
                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                        body
                    </label>
                    <textarea
                        value={transaction.body || ""}
                        onChange={(e) => handleChange(e, "body", tIndex)}
                        style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px", minHeight: "80px" }}
                    />
                </div>
            )}

            <h4 style={{ fontSize: "1rem", fontWeight: "500", marginTop: "8px" }}>Headers</h4>
            {Object.entries(transaction.headers).length === 0 && (
                <div style={{ marginBottom: "8px", fontStyle: "italic" }}>No headers added.</div>
            )}
            {Object.entries(transaction.headers).map(([headerKey, headerValue], headerIndex) => (
                <HeaderRow
                    key={`${tIndex}-header-${headerIndex}`}
                    transactionIndex={tIndex}
                    headerKey={headerKey}
                    headerValue={headerValue}
                    updateHeaderKey={updateHeaderKey}
                    updateHeaderValue={updateHeaderValue}
                    removeHeader={removeHeader}
                />
            ))}
            <button
                type="button"
                onClick={() => addHeader(tIndex)}
                style={{
                    backgroundColor: "#10b981",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    marginTop: "8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                <FaPlus style={{ marginRight: "4px" }} /> Add Header
            </button>

            <h4 style={{ fontSize: "1rem", fontWeight: "500", marginTop: "8px" }}>Extractors</h4>
            {transaction.extractors.length === 0 && (
                <div style={{ marginBottom: "8px", fontStyle: "italic" }}>No Extractors added.</div>
            )}
            {transaction.extractors.map((extractor, exIndex) => (
                <div
                    key={exIndex}
                    style={{ display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px" }}
                >
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <input
                            type="text"
                            value={extractor.name}
                            placeholder="Name of parameter"
                            onChange={(e) => handleChange(e, "name", tIndex, exIndex)}
                            style={{ border: "1px solid #ccc", padding: "8px", width: "20%", minWidth: "120px", borderRadius: "4px" }}
                        />
                        <select
                            value={extractor.type || "jsonpath"}
                            onChange={(e) => handleChange(e, "type", tIndex, exIndex)}
                            style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px" }}
                        >
                            <option value="jsonpath">JSONPath</option>
                            <option value="xpath">XPath</option>
                            <option value="regexp">RegExp</option>
                        </select>
                        <input
                            type="text"
                            value={extractor[extractor.type || "jsonpath"] || ""}
                            placeholder={
                                extractor.type === "xpath"
                                    ? "XPath (ex: //tag)"
                                    : extractor.type === "regexp"
                                        ? "RegExp (ex: /regex/)"
                                        : "JSONPath (ex: $.payload.success)"
                            }
                            onChange={(e) => {
                                const key = extractor.type || "jsonpath";
                                handleChange(e, key, tIndex, exIndex);
                            }}
                            style={{ border: "1px solid #ccc", padding: "8px", flex: "1", minWidth: "200px", borderRadius: "4px" }}
                        />
                        <button
                            type="button"
                            onClick={() => removeExtractor(tIndex, exIndex)}
                            style={{
                                backgroundColor: "#ef4444",
                                color: "#fff",
                                padding: "4px 8px",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaTrashAlt style={{ marginRight: "4px" }} /> Remove
                        </button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column" }}>
                        <label style={{ fontSize: "0.75rem", fontWeight: "500", marginBottom: "2px" }}>
                            Parameter to be used
                        </label>
                        <input
                            type="text"
                            readOnly
                            value={`\${${extractor.name}}`}
                            style={{ border: "1px solid #ccc", padding: "8px", borderRadius: "4px", backgroundColor: "#eee", width: "100%" }}
                        />
                    </div>
                </div>
            ))}
            <button
                type="button"
                onClick={() => addExtractor(tIndex)}
                style={{
                    backgroundColor: "#10b981",
                    color: "#fff",
                    padding: "8px 16px",
                    border: "none",
                    borderRadius: "4px",
                    marginTop: "8px",
                    marginBottom: "8px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center"
                }}
            >
                <FaPlus style={{ marginRight: "4px" }} /> Add Extractor
            </button>
        </div>
    );
}

export default function App() {
    const initialData = {
        name: "",
        scenario: "",
        pacing: "1000",
        users: 2,
        duration: 2,
        userpathname: "",
        files: [],
        transactions: [],
    };

    const [formData, setFormData] = useState(initialData);
    const [activeTab, setActiveTab] = useState("form");
    const [generatedScript, setGeneratedScript] = useState("");
    const [jsonText, setJsonText] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);

    const transformExtractors = useCallback((extractors) =>
        extractors.map((extractor) => {
            const newExtractor = { name: extractor.name };
            if (extractor.type === "jsonpath") {
                newExtractor.jsonpath = extractor.jsonpath;
            } else if (extractor.type === "xpath") {
                newExtractor.xpath = extractor.xpath;
            } else if (extractor.type === "regexp") {
                newExtractor.regexp = extractor.regexp;
            }
            return newExtractor;
        }), []);

    const getTransformedFormData = useCallback(() => {
        return {
            ...formData,
            transactions: formData.transactions.map((transaction) => ({
                ...transaction,
                extractors: transformExtractors(transaction.extractors || []),
            })),
        };
    }, [formData, transformExtractors]);

    useEffect(() => {
        if (activeTab === "json") {
            const transformedData = getTransformedFormData();
            setJsonText(JSON.stringify(transformedData, null, 2));
        }
    }, [activeTab, getTransformedFormData]);

    const isValidUrl = (url) => {
        try {
            new URL(url);
            return true;
        } catch (error) {
            return false;
        }
    };

    const handleChange = useCallback((e, fieldKey, transactionIndex, extractorIndex) => {
        const value = e.target.value;
        setFormData((prev) => {
            const newData = { ...prev };
            if (transactionIndex !== undefined) {
                if (extractorIndex !== undefined) {
                    newData.transactions[transactionIndex].extractors[extractorIndex][fieldKey] = value;
                } else {
                    newData.transactions[transactionIndex][fieldKey] = value;
                }
            } else {
                newData[fieldKey] = value;
            }
            return newData;
        });
    }, []);

    const updateHeaderValue = useCallback((transactionIndex, headerKey, newValue) => {
        setFormData((prev) => {
            const newData = { ...prev };
            newData.transactions[transactionIndex].headers[headerKey] = newValue;
            return newData;
        });
    }, []);

    const updateHeaderKey = useCallback((transactionIndex, oldKey, newKey) => {
        if (newKey.trim() === "" || newKey === oldKey) return;
        setFormData((prev) => {
            const newData = { ...prev };
            const headers = { ...newData.transactions[transactionIndex].headers };
            const value = headers[oldKey];
            delete headers[oldKey];
            headers[newKey] = value;
            newData.transactions[transactionIndex].headers = headers;
            return newData;
        });
    }, []);

    const updateTransaction = useCallback((index, newTransaction) => {
        setFormData((prev) => {
            const newTransactions = [...prev.transactions];
            newTransactions[index] = newTransaction;
            return { ...prev, transactions: newTransactions };
        });
    }, []);

    const addTransaction = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            transactions: [
                ...prev.transactions,
                {
                    name: "",
                    url: "",
                    assertion: "",
                    method: "GET",
                    body: "",
                    headers: {},
                    extractors: [],
                },
            ],
        }));
    }, []);

    const removeTransaction = useCallback((index) => {
        setFormData((prev) => ({
            ...prev,
            transactions: prev.transactions.filter((_, i) => i !== index)
        }));
    }, []);

    const addHeader = useCallback((transactionIndex) => {
        setFormData((prev) => {
            const newData = { ...prev };
            let headers = { ...newData.transactions[transactionIndex].headers };
            let newKey = "";
            if (headers.hasOwnProperty("")) {
                let i = 1;
                while (headers.hasOwnProperty(`New-Header-${i}`)) {
                    i++;
                }
                newKey = `New-Header-${i}`;
            }
            headers[newKey] = "";
            newData.transactions[transactionIndex].headers = headers;
            return newData;
        });
    }, []);

    const removeHeader = useCallback((transactionIndex, headerKey) => {
        setFormData((prev) => {
            const newData = { ...prev };
            const headers = { ...newData.transactions[transactionIndex].headers };
            delete headers[headerKey];
            newData.transactions[transactionIndex].headers = headers;
            return newData;
        });
    }, []);

    const addExtractor = useCallback((transactionIndex) => {
        setFormData((prev) => {
            const newData = { ...prev };
            const extractors = newData.transactions[transactionIndex].extractors || [];
            newData.transactions[transactionIndex].extractors = [
                ...extractors,
                { name: "", type: "jsonpath", jsonpath: "" },
            ];
            return newData;
        });
    }, []);

    const removeExtractor = useCallback((transactionIndex, extractorIndex) => {
        setFormData((prev) => {
            const newData = { ...prev };
            newData.transactions[transactionIndex].extractors.splice(extractorIndex, 1);
            return newData;
        });
    }, []);

    const updateFile = useCallback((fileIndex, fieldKey, value) => {
        setFormData((prev) => {
            const newFiles = [...prev.files];
            if (fieldKey === "column_names") {
                newFiles[fileIndex][fieldKey] = value.split(",").map((s) => s.trim()).filter(Boolean);
            } else {
                newFiles[fileIndex][fieldKey] = value;
            }
            return { ...prev, files: newFiles };
        });
    }, []);

    const addFile = useCallback(() => {
        setFormData((prev) => ({
            ...prev,
            files: [...prev.files, { name: "", column_names: [], path: "" }],
        }));
    }, []);

    const removeFile = useCallback((fileIndex) => {
        setFormData((prev) => ({
            ...prev,
            files: prev.files.filter((_, i) => i !== fileIndex)
        }));
    }, []);

    const handleSubmit = async (e) => {
        if (e && e.preventDefault) e.preventDefault();

        for (let i = 0; i < formData.transactions.length; i++) {
            const transactionUrl = formData.transactions[i].url;
            if (!isValidUrl(transactionUrl)) {
                alert(`Transaction ${i + 1}: URL is invalid. Please enter a correct URL before submitting.`);
                return;
            }
        }

        setIsGenerating(true);
        try {
            const transformedData = getTransformedFormData();
            const response = await fetch(`${backendUrl}/NeoLoadYamlGenerator`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(transformedData),
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const text = await response.text();
            setGeneratedScript(text);
            setActiveTab("generatedScript");
        } catch (error) {
            console.error("Error during submission:", error);
            alert("Error generating script: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const saveScript = () => {
        if (!generatedScript) return;
        const blob = new Blob([generatedScript], { type: "text/yaml" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "default.yaml";
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
    };

    const applyJsonChanges = () => {
        try {
            const parsed = JSON.parse(jsonText);
            setFormData(parsed);
            alert("JSON changes applied successfully!");
        } catch (error) {
            alert("Invalid JSON: " + error.message);
        }
    };

    return (
        <div style={{ padding: "16px", maxWidth: "1200px" }}>
            <h1 style={{ display: "flex", alignItems: "center", fontSize: "2rem", fontWeight: "bold", marginBottom: "16px" }}>
                <SiYaml style={{ marginRight: "8px", fontSize: "2.5rem", color: "#FCA121" }} />
                NeoLoad Test-as-code generator
            </h1>

            <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
                <button
                    type="button"
                    onClick={() => setActiveTab("form")}
                    style={{
                        backgroundColor: activeTab === "form" ? "#3b82f6" : "#e5e7eb",
                        color: activeTab === "form" ? "#fff" : "#000",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <FaWpforms style={{ marginRight: "4px" }} /> Form
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("json")}
                    style={{
                        backgroundColor: activeTab === "json" ? "#3b82f6" : "#e5e7eb",
                        color: activeTab === "json" ? "#fff" : "#000",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <FaFileCode style={{ marginRight: "4px" }} /> JSON
                </button>
                <button
                    type="button"
                    onClick={() => setActiveTab("generatedScript")}
                    style={{
                        backgroundColor: activeTab === "generatedScript" ? "#3b82f6" : "#e5e7eb",
                        color: activeTab === "generatedScript" ? "#fff" : "#000",
                        padding: "8px 16px",
                        border: "none",
                        borderRadius: "4px",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center"
                    }}
                >
                    <FaFileAlt style={{ marginRight: "4px" }} /> Generated script
                </button>
            </div>

            {activeTab === "form" && (
                <div style={{ width: "100%", maxWidth: "800px" }}>
                    {Object.keys(initialData).map(
                        (key) =>
                            key !== "transactions" &&
                            key !== "files" && (
                                <div key={key} style={{ marginBottom: "12px" }}>
                                    <label style={{ display: "block", fontSize: "0.875rem", fontWeight: "500" }}>
                                        {key === "pacing"
                                            ? "pacing (milliseconds)"
                                            : key === "duration"
                                                ? "duration (minutes)"
                                                : key === "name"
                                                    ? "project name"
                                                    : key}
                                    </label>
                                    <input
                                        type="text"
                                        value={formData[key]}
                                        onChange={(e) => handleChange(e, key)}
                                        style={{ border: "1px solid #ccc", padding: "8px", width: "100%", borderRadius: "4px" }}
                                    />
                                </div>
                            )
                    )}

                    <h2 style={{ fontSize: "1.25rem", marginTop: "16px" }}>Parameters from CSV file</h2>
                    <div style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
                        {formData.files.length === 0 && (
                            <div style={{ marginBottom: "8px", fontStyle: "italic" }}>No files added.</div>
                        )}
                        {formData.files.map((file, index) => (
                            <FileRow key={index} fileIndex={index} fileData={file} updateFile={updateFile} removeFile={removeFile} />
                        ))}
                        <button
                            type="button"
                            onClick={addFile}
                            style={{
                                backgroundColor: "#10b981",
                                color: "#fff",
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "4px",
                                marginTop: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaPlus style={{ marginRight: "4px" }} /> Add File
                        </button>
                    </div>

                    <h2 style={{ fontSize: "1.25rem", marginTop: "16px" }}>Transactions</h2>
                    <div style={{ border: "1px solid #ddd", padding: "12px", borderRadius: "4px", marginBottom: "16px" }}>
                        {formData.transactions.length === 0 && (
                            <div style={{ marginBottom: "8px", fontStyle: "italic" }}>No transactions added.</div>
                        )}
                        {formData.transactions.map((transaction, tIndex) => (
                            <TransactionRow
                                key={tIndex}
                                transaction={transaction}
                                tIndex={tIndex}
                                handleChange={handleChange}
                                removeTransaction={removeTransaction}
                                updateHeaderKey={updateHeaderKey}
                                updateHeaderValue={updateHeaderValue}
                                removeHeader={removeHeader}
                                addHeader={addHeader}
                                addExtractor={addExtractor}
                                removeExtractor={removeExtractor}
                                updateTransaction={updateTransaction}
                            />
                        ))}
                        <button
                            type="button"
                            onClick={addTransaction}
                            style={{
                                backgroundColor: "#10b981",
                                color: "#fff",
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "4px",
                                marginTop: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaPlus style={{ marginRight: "4px" }} /> Add Transaction
                        </button>
                    </div>

                    <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={isGenerating}
                        style={{
                            backgroundColor: isGenerating ? "#9ca3af" : "#10b981",
                            color: "#fff",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            marginTop: "8px",
                            cursor: isGenerating ? "not-allowed" : "pointer",
                            display: "flex",
                            alignItems: "center",
                            opacity: isGenerating ? 0.6 : 1
                        }}
                    >
                        <FaDownload style={{ marginRight: "4px" }} /> {isGenerating ? "Generating..." : "Generate script"}
                    </button>
                </div>
            )}

            {activeTab === "json" && (
                <div style={{ width: "100%", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "8px" }}>JSON</h3>
                    <textarea
                        value={jsonText}
                        onChange={(e) => setJsonText(e.target.value)}
                        style={{
                            border: "1px solid #ddd",
                            padding: "16px",
                            borderRadius: "4px",
                            backgroundColor: "#f9fafb",
                            width: "100%",
                            minHeight: "300px",
                            fontSize: "0.75rem",
                            whiteSpace: "pre-wrap",
                            fontFamily: "monospace"
                        }}
                    />
                    <button
                        type="button"
                        onClick={applyJsonChanges}
                        style={{
                            backgroundColor: "#10b981",
                            color: "#fff",
                            padding: "8px 16px",
                            border: "none",
                            borderRadius: "4px",
                            marginTop: "8px",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center"
                        }}
                    >
                        <FaCheck style={{ marginRight: "4px" }} /> Apply JSON changes to form
                    </button>
                </div>
            )}

            {activeTab === "generatedScript" && (
                <div style={{ width: "100%", maxWidth: "800px" }}>
                    <h3 style={{ fontSize: "1.125rem", fontWeight: "600", marginBottom: "8px" }}>
                        Generated script
                    </h3>
                    <div style={{ border: "1px solid #ddd", padding: "16px", borderRadius: "4px", backgroundColor: "#f9fafb", overflow: "auto", maxHeight: "600px" }}>
                        <pre style={{ fontSize: "0.75rem", whiteSpace: "pre-wrap", margin: 0, fontFamily: "monospace" }}>
                            {generatedScript ? generatedScript : "No script generated yet."}
                        </pre>
                    </div>
                    {generatedScript && (
                        <button
                            type="button"
                            onClick={saveScript}
                            style={{
                                backgroundColor: "#10b981",
                                color: "#fff",
                                padding: "8px 16px",
                                border: "none",
                                borderRadius: "4px",
                                marginTop: "8px",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center"
                            }}
                        >
                            <FaDownload style={{ marginRight: "4px" }} /> Save as default.yaml
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}