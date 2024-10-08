# Cucumber to Playwright

Convert Cucumber feature files to Playwright test scripts.

## Installation

To install this package, run:

```bash
npm install cucumber-to-playwright --save-dev
```

If you want to use the library globally, you can install it using:

```bash
npm install -g cucumber-to-playwright
```

## Usage

### Command-Line Usage

You can use `cucumber-to-playwright` directly from the command line with the `fts` command:

```bash
fts <inputFilePath> <outputFilePath>
# OR
cucumber-to-playwright <inputFilePath> <outputFilePath>
```

- `<inputFilePath>`: Path to the input Cucumber `.feature` file.
- `<outputFilePath>`: Path to the output Playwright test file.

For example:

```bash
fts ./features/myFeature.feature ./tests/myFeature.spec.js
```

This will read the feature file at `./features/myFeature.feature` and convert it to a Playwright test at `./tests/myFeature.spec.js`.

### Usage in `package.json`

Add a script in your project's `package.json`:

```json
{
  "scripts": {
    "test:convert": "fts"
  }
}
```

Then, you can run the conversion using:

```bash
npm run test:convert -- ./features/myFeature.feature ./tests/myFeature.spec.js
```

### Local Development

If you want to test or use this library locally without publishing it to npm:

1. Clone the repository or place the code in a local folder.
2. Run the following command inside the library directory:

   ```bash
   npm link
   ```

3. In your target project, link the package:

   ```bash
   npm link cucumber-to-playwright
   ```

Now, you can use the `fts` command in your project as if it was installed from npm.

## Contributing

Feel free to submit issues or pull requests if you find bugs or have suggestions for improvement.

## License

This project is licensed under the MIT License.


## Author

Josh Lavely <josh@lavely.io>