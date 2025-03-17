# NeoLoad Test-as-Code Generator

This is a React-based application that serves as a GUI tool for generating NeoLoad Test-as-Code scripts. It allows users to create, edit, and manage HTTP transactions, headers, extractors, and file-based parameters, and ultimately generate a YAML configuration for NeoLoad.

---

## Features

- **HTTP Request Parsing:** Import raw HTTP request.
- **Transaction Management:** Add, update, and remove transactions with fields such as name, URL, method, body, and assertion.
- **Dynamic Headers & Extractors:** Easily manage headers and extractors for each transaction.
- **File Parameter Support:** Handle CSV file parameters by specifying column names and file paths.
- **JSON & YAML Integration:** View and edit form data as JSON and generate a YAML script.
- **Script Download:** Save the generated YAML configuration as a file.

---

![Screendump of the application](screenshots/screendump.png)

---

**Note:** The NeoLoadCompare backend is required to use this application. Make sure the backend is installed and running before using any features.

---

## Installation

To install and run the application with npm, follow these steps:

1. **Clone the Repository:**

   ```bash
   git clone https://github.com/yourusername/neoload-test-as-code-generator.git
   cd neoload-test-as-code-generator```

2. **add endpoint to NeoLoadUtils in config.js:**
   ```export const backendUrl = process.env.REACT_APP_BACKEND_URL || "https://your-neoloadutils-endpoint.com";```   
   
## Install Dependencies:

Ensure you have Node.js installed, then run:

   ```bash
npm install
npm start

