import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";

// Base URL for Emailnator
const url = "https://www.emailnator.com";

// Add stealth plugin to puppeteer
puppeteer.use(StealthPlugin());

// Helper function to pause execution
const sleep = (ms = 500) => new Promise((r) => setTimeout(r, ms));

// Function to generate a random delay
function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min);
}

// Function to get a new user agent
function getNewUserAgent() {
  return new UserAgent({ deviceCategory: "desktop" }).toString();
}

// Function to simulate human-like scrolling
async function simulateScrolling(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let totalHeight = 0;
      const distance = 100;
      const timer = setInterval(() => {
        window.scrollBy(0, distance);
        totalHeight += distance;

        if (totalHeight >= document.body.scrollHeight) {
          clearInterval(timer);
          resolve();
        }
      }, 100);
    });
  });
}

// Function to add random mouse movements
async function randomMouseMovements(page) {
  await page.mouse.move(
    Math.random() * page.viewport().width,
    Math.random() * page.viewport().height,
    { steps: 10 }
  );
}

// Function to set up the browser page with common configurations and anti-detection measures
async function setupPage(browser) {
  const page = await browser.newPage();

  // Set a new custom user agent for each page
  const customUserAgent = getNewUserAgent();
  await page.setUserAgent(customUserAgent);

  // Set additional headers to mimic a real browser
  await page.setExtraHTTPHeaders({
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    Referer: "https://www.google.com/",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "cross-site",
    "Sec-Fetch-User": "?1",
    "Upgrade-Insecure-Requests": "1",
  });

  // Set viewport to a common resolution
  await page.setViewport({
    width: 1366,
    height: 768,
    deviceScaleFactor: 1,
  });

  await Promise.all([
    page.setCacheEnabled(false),
    page.setJavaScriptEnabled(true),
    page.setOfflineMode(false),
    page.setBypassServiceWorker(true),
    page.setRequestInterception(true),
  ]);

  // Override certain browser features to make detection harder
  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => undefined });
    Object.defineProperty(navigator, "languages", {
      get: () => ["en-US", "en"],
    });
    Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
  });

  // Intercept and modify certain requests
  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  // Automatically dismiss any dialogs
  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  return page;
}

// Function to handle cookie consent
async function handleCookieConsent(page) {
  try {
    await page.waitForSelector(".fc-button-background", { timeout: 5000 });
    await page.click(".fc-button-background");
  } catch (error) {}
}

// Function to generate a new email
export async function generateEmail() {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      ignoreHTTPSErrors: true,
    });
    const page = await setupPage(browser);

    await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });

    // Simulate human-like behavior
    await simulateScrolling(page);
    await randomMouseMovements(page);
    await sleep(randomDelay(1000, 3000));

    // Handle cookie consent
    await handleCookieConsent(page);

    // Configure email options
    await page.waitForSelector("#custom-switch-domain", { timeout: 10000 });
    await page.waitForSelector("#custom-switch-plusGmail", { timeout: 10000 });
    await page.waitForSelector("#custom-switch-googleMail", { timeout: 10000 });

    await page.click("#custom-switch-domain");
    await sleep(randomDelay(200, 500));
    await page.click("#custom-switch-plusGmail");
    await sleep(randomDelay(200, 500));
    await page.click("#custom-switch-googleMail");

    // Generate email
    const generateButtonSelector =
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.justify-content-md-center.row > div > button";
    await page.waitForSelector(generateButtonSelector, { timeout: 10000 });
    await page.click(generateButtonSelector);
    await sleep(randomDelay(200, 500));
    await page.click(generateButtonSelector);
    await sleep(randomDelay(500, 1000));

    // Get generated email
    const emailInputSelector =
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.mb-3.input-group > input";
    await page.waitForSelector(emailInputSelector, { timeout: 10000 });
    const element = await page.$(emailInputSelector);

    let generatedEmail = null;
    if (element !== null) {
      const text = await (await element.getProperty("value")).jsonValue();
      if (text.endsWith("@gmail.com") || text.includes("+")) {
        generatedEmail = text;
      }
    }

    await browser.close();
    return generatedEmail;
  } catch (error) {
    console.error("Error in generateEmail:", error);
    return null;
  }
}

// Function to check inbox for a given email
export async function inbox(email) {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      ignoreHTTPSErrors: true,
    });
    const page = await setupPage(browser);

    await page.goto(url + "/inbox#" + email, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Simulate human-like behavior
    await simulateScrolling(page);
    await randomMouseMovements(page);
    await sleep(randomDelay(1000, 3000));

    // Handle cookie consent
    await handleCookieConsent(page);

    await sleep(randomDelay(500, 1500));

    // Get email messages
    await page.waitForSelector(
      "div.mb-3.col-lg-6.col-sm-12 table.message_container",
      { timeout: 10000 }
    );
    const elements = await page.$$("div.mb-3.col-lg-6.col-sm-12 table");

    const contentEmails = await Promise.all(
      elements.map(async (element) => {
        return await element.evaluate((el) => el.innerHTML);
      })
    );

    // Extract href links from emails
    const hrefLinks = contentEmails.map((content) => {
      const hrefRegex = /href="([^"]*)"/g;
      const hrefMatches = content.matchAll(hrefRegex);
      return Array.from(hrefMatches, (match) => match[1]).filter(
        (href) => href.length > 0
      );
    });

    const hrefsMails = hrefLinks.filter((href) => href.length > 0);

    // Extract table content
    const tableRegex = /<table[^>]*>(.*?)<\/table>/g;
    const tableMatches = contentEmails[0].matchAll(tableRegex);
    const tables = Array.from(tableMatches, (match) => match[1]);

    // Process table content
    const result = [];
    tables.forEach((element, index) => {
      const tdRegex = /<td[^>]*>(.*?)<\/td>/g;
      const tdMatches = element.matchAll(tdRegex);
      const tds = Array.from(tdMatches, (match) => match[1]);

      hrefsMails.forEach((element) => {
        tds.push(element[index]);
      });

      result.push(tds);
    });

    await browser.close();
    return result;
  } catch (error) {
    console.error("Error in inbox:", error);
    return null;
  }
}

// Function to get a specific message for a given email
export async function message(id, email) {
  try {
    const browser = await puppeteer.launch({
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
      ],
      ignoreHTTPSErrors: true,
    });
    const page = await setupPage(browser);

    await page.goto(`https://www.emailnator.com/inbox/${email}/${id}`, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });

    // Simulate human-like behavior
    await simulateScrolling(page);
    await randomMouseMovements(page);
    await sleep(randomDelay(1000, 3000));

    // Handle cookie consent
    await handleCookieConsent(page);

    // Get mail content
    const mailElements = await page.$$eval(
      "#root > div > section > div > div > div.mb-3.col-lg-6.col-sm-12 > div > div > div.card > div > div",
      (elements) => elements.map((element) => element.innerHTML)
    );

    await browser.close();
    return mailElements;
  } catch (error) {
    console.error("Error in message:", error);
    return null;
  }
}
