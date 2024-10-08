#!/usr/bin/env node
const fs = require("fs");
const readline = require("readline");

const stepMappings = {
  "Then I expect that element": (line) => {
    const match = line.match(
      /"([^"]+)" (does exist|does not exist|has the class|does not have the class|matches the text|contains the text) "?(.*)"?/
    );
    if (match) {
      const [, selector, condition, text] = match;
      return convertElementExpectation(selector, condition, text);
    }
    return `// Step not mapped: ${line}`;
  },
  "When I go to the": (line) => {
    const [, url] = line.match(/the "([^"]+)" url/);
    return `await page.goto('${url}');`;
  },
  "Given I mock": (line, multiLineContent) => {
    const [, method, url] = line.match(/"([^"]+)" "([^"]+)"/);
    const statusCodeMatch = line.match(/with status (\d+)/);
    const statusCode = statusCodeMatch ? statusCodeMatch[1] : "200";
    return `await page.route('${url}', (route) => route.fulfill({ status: ${statusCode}, body: \`${
      multiLineContent || ""
    }\` }));`;
  },
  "And I delete the cookie": (line) => {
    const [, cookieName] = line.match(/"([^"]+)"/);
    return `await page.context().clearCookies(); // Clear the '${cookieName}' cookie`;
  },
  "And I am an authenticated user": () => {
    return `// Simulate user authentication (e.g., set cookies or tokens)`;
  },
  "And I am a european user": () => {
    return `// Simulate user with European settings (e.g., setting localization preferences)`;
  },
  "When I select the": (line) => {
    const [, input] = line.match(/the "([^"]+)" radio input/);
    return `await page.check('input[name="${input}"]');`;
  },
  "When I fill in the": (line) => {
    const [, field, value] = line.match(/the "([^"]+)" field with "([^"]+)"/);
    return `await page.fill('[name="${field}"]', '${value}');`;
  },
  "And I submit the form": (line) => {
    const [, formSelector] = line.match(/form "([^"]+)"/);
    return `await page.locator('${formSelector}').submit();`;
  },
  "When I click on the": (line) => {
    const [, selector] = line?.match(/"([^"]+)" button/);
    return `await page.click('${selector}');`;
  },
  "Then I expect that mock": (line) => {
    const match = line?.match(/mock "([^"]+)" was called/);
    if (match) {
      const [, url] = match;
      return `// Verify that the route for '${url}' was called (Playwright does not have direct mock verification)`;
    }
    return `// Step not mapped: ${line}`;
  },
};

function convertElementExpectation(selector, condition, text) {
  switch (condition) {
    case "matches the text":
      return `await expect(page.locator('${selector}')).toHaveText('${text}');`;
    case "contains the text":
      return `await expect(page.locator('${selector}')).toContainText('${text}');`;
    case "does exist":
      return `await expect(page.locator('${selector}')).toBeVisible();`;
    case "does not exist":
      return `await expect(page.locator('${selector}')).not.toBeVisible();`;
    case "has the class":
      return `await expect(page.locator('${selector}')).toHaveClass(/${text}/);`;
    case "does not have the class":
      return `await expect(page.locator('${selector}')).not.toHaveClass(/${text}/);`;
    default:
      return `// Unsupported condition: ${condition}`;
  }
}

// Function to convert feature file content to Playwright test content
function convertFeatureToPlaywright(inputContent) {
  const lines = inputContent.split("\n");
  let outputContent = "";

  outputContent += `import { test, expect } from '@playwright/test';\n\n`;
  outputContent += `test.describe('${
    lines[0]?.trim()?.replace("Feature:", "") || "Converted Feature"
  }', () => {\n`;
  outputContent += `  test.beforeEach(async ({ page }) => {\n    // Add any setup steps here\n  });\n\n`;

  let inScenario = false;
  let scenarioName = "";
  let multiLineContent = "";
  let capturingMultiLine = false;

  lines.forEach((line) => {
    line = line.trim();

    //console.log(steps, stepMappings);

    if (line.startsWith("Scenario:")) {
      // Close the previous test block if one is open
      if (inScenario) {
        outputContent += `  });\n\n`;
      }
      inScenario = true;
      scenarioName = line.replace("Scenario: ", "");
      outputContent += `  test('${scenarioName}', async ({ page }) => {\n`;
    } else if (line.startsWith('"""')) {
      capturingMultiLine = !capturingMultiLine;
      if (!capturingMultiLine) {
        multiLineContent = multiLineContent.trim();
      } else {
        multiLineContent = "";
      }
    } else if (capturingMultiLine) {
      multiLineContent += `${line}\n`;
    } else if (
      line.startsWith("Given") ||
      line.startsWith("When") ||
      line.startsWith("Then") ||
      line.startsWith("And")
    ) {
      let stepKey = "";
      let stepAction = "";
      const steps = Object.entries(stepMappings);
      steps.forEach(([k, b]) => {
        if (line) {
          console.log(`Step: ${k} , Line: ${line}`);
          if (line.includes(k)) {
            console.log("have step");
            let a = line.split(k);
            stepKey = k;
            stepAction = (_line = line, _multiLine) => b(_line, _multiLine);
          }
        }
      });
      const convertedStep = stepAction;
      console.log(`converted step: ${convertedStep}`);
      if (convertedStep) {
        const convertedLine = stepAction(line, multiLineContent);
        outputContent += `    ${convertedLine}\n`;
        multiLineContent = ""; // Reset after using the content
      } else {
        outputContent += `    // Step not mapped: ${line}\n`;
      }
      // reset
      stepKey = "";
      stepAction = "";
    }
  });

  // Close the last test block if it's still open
  if (inScenario) {
    outputContent += `  });\n`;
  }

  outputContent += `});\n`;

  return outputContent;
}

// Readline interface for user input when file paths are not provided
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Function to read file paths and handle conversion
function convertFile(inputFilePath, outputFilePath) {
  fs.readFile(inputFilePath, "utf8", (err, data) => {
    if (err) {
      console.error("Error reading file:", err);
      rl.close();
      return;
    }

    // Convert the content to Playwright
    const convertedContent = convertFeatureToPlaywright(data);

    // Write the output to the Playwright spec file
    fs.writeFile(outputFilePath, convertedContent, (err) => {
      if (err) {
        console.error("Error writing file:", err);
      } else {
        console.log(`Successfully converted to ${outputFilePath}`);
      }
      rl.close();
    });
  });
}

// Function to get input and output file paths if not provided
function askForFilePath(question, callback) {
  rl.question(question, (answer) => {
    callback(answer);
  });
}

// Main script logic to handle command-line arguments or prompt for input
function main() {
  const inputFilePath = process.argv[2];
  const outputFilePath = process.argv[3];

  if (inputFilePath && outputFilePath) {
    // If file paths are provided as command-line arguments, use them
    convertFile(inputFilePath, outputFilePath);
  } else {
    // If file paths are not provided, ask the user for input and output paths
    askForFilePath(
      "Please provide the path to the input Cucumber feature file: ",
      (inputPath) => {
        askForFilePath(
          "Please provide the path to the output Playwright test file: ",
          (outputPath) => {
            convertFile(inputPath, outputPath);
          }
        );
      }
    );
  }
}

// Run the main function
main();
