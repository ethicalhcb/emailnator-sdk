# Emailnator Unofficial SDK

Emailnator Unofficial SDK is a Unofficial SDK interface for generating email addresses and reading emails. Please use it responsibly and ethically.

> **Please note that I am not responsible for the usage of this program. Use it responsibly and ethically.**

## 📦 Installation

To install, you need to have Node.js and npm installed on your machine. If you don't have them installed, you can install them from [here](https://nodejs.org/en/download/).

To install Emailnator Unofficial SDK, run the following command:

```bash
npm install emailnator-sdk
```

## 👨‍💻 Usage

```typescript
// index.ts
import {
  configureEmailnator,
  generateEmail,
  inbox,
  message,
} from "emailnator-sdk";

// Configure the script before using the main functions
configureEmailnator({
  executionSpeed: 100, // Percentage of default speed (100% = normal speed)
  simulateHumanBehavior: true, // Whether to simulate human behavior (scrolling, mouse movements)
  useRandomUserAgent: true, // Whether to use a random user agent for each request
  handleCookieConsent: true, // Whether to handle cookie consent pop-ups
  logErrors: true, // Whether to log errors to the console
  timeouts: {
    navigation: 45000, // Timeout for page navigation in milliseconds
    waitForSelector: 1500, // Timeout for waiting for a selector in milliseconds
  },
});

// generate email
generateEmail().then((email: any) => {
  console.log(email);
});

// inbox message list
inbox("xxxx.xxxx.xxxx@gmail.com").then((emails: any) => {
  console.log(emails);
});

// get message by id (get to list)
message("xxxx.xxxx.xxxx@gmail.com", "MTkwZmQ4MjU3MjU4ODhkMQ==").then(
  (email: any) => {
    console.log(email);
  }
);
```

## 🔗 Links:

- NPM : [https://www.npmjs.com/package/emailnator-sdk](https://www.npmjs.com/package/emailnator)
- Github : [https://github.com/ethicalhcb/emailnator-sdk/](https://github.com/ethicalhcb/emailnator-cli/)

## License

Emailnator Unofficial SDK is licensed under the MIT license.

help me here ❤️ : https://patreon.com/benoitpetit
