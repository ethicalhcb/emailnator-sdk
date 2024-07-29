import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";

const url = "https://www.emailnator.com";

puppeteer.use(StealthPlugin());

// Global configuration object
let globalConfig = {
  executionSpeed: 100, // Percentage of default speed (100% = normal speed)
  simulateHumanBehavior: true, // Whether to simulate human behavior (scrolling, mouse movements)
  useRandomUserAgent: true, // Whether to use a random user agent for each request
  handleCookieConsent: true, // Whether to handle cookie consent pop-ups
  logErrors: true, // Whether to log errors to the console
  timeouts: {
    navigation: 60000, // Timeout for page navigation in milliseconds
    waitForSelector: 10000, // Timeout for waiting for a selector in milliseconds
  }
};

// Function to set global configuration
/**
 * Configures the Emailnator SDK with the provided configuration.
 *
 * @param {Object} config - The configuration object.
 */
export function configureEmailnator(config) {
  globalConfig = { ...globalConfig, ...config };
}

const sleep = (ms = 500) => new Promise((r) => setTimeout(r, ms * (100 / globalConfig.executionSpeed)));

function randomDelay(min, max) {
  return Math.floor(Math.random() * (max - min + 1) + min) * (100 / globalConfig.executionSpeed);
}

function getNewUserAgent() {
  return new UserAgent({ deviceCategory: "desktop" }).toString();
}

async function simulateScrolling(page) {
  if (globalConfig.simulateHumanBehavior) {
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
}

async function randomMouseMovements(page) {
  if (globalConfig.simulateHumanBehavior) {
    await page.mouse.move(
      Math.random() * page.viewport().width,
      Math.random() * page.viewport().height,
      { steps: 10 }
    );
  }
}

async function setupPage(browser) {
  const page = await browser.newPage();
  
  if (globalConfig.useRandomUserAgent) {
    const customUserAgent = getNewUserAgent();
    await page.setUserAgent(customUserAgent);
  }

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Upgrade-Insecure-Requests': '1',
  });

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

  await page.evaluateOnNewDocument(() => {
    Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    Object.defineProperty(navigator, 'languages', { get: () => ['en-US', 'en'] });
    Object.defineProperty(navigator, 'plugins', { get: () => [1, 2, 3, 4, 5] });
  });

  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "stylesheet", "font", "media"].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  return page;
}

async function handleCookieConsent(page) {
  if (globalConfig.handleCookieConsent) {
    try {
      await page.waitForSelector(".fc-button-background", { timeout: globalConfig.timeouts.waitForSelector });
      await page.click(".fc-button-background");
    } catch (error) {
      if (globalConfig.logErrors) {
        console.log("Cookie consent button not found or not clickable. Continuing without clicking.");
      }
    }
  }
}

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

    await page.goto(url, { waitUntil: 'networkidle2', timeout: globalConfig.timeouts.navigation });

    if (globalConfig.simulateHumanBehavior) {
      await simulateScrolling(page);
      await randomMouseMovements(page);
      await sleep(randomDelay(1000, 3000));
    }

    await handleCookieConsent(page);

    await page.waitForSelector("#custom-switch-domain", { timeout: globalConfig.timeouts.waitForSelector });
    await page.waitForSelector("#custom-switch-plusGmail", { timeout: globalConfig.timeouts.waitForSelector });
    await page.waitForSelector("#custom-switch-googleMail", { timeout: globalConfig.timeouts.waitForSelector });

    await page.click("#custom-switch-domain");
    await sleep(randomDelay(200, 500));
    await page.click("#custom-switch-plusGmail");
    await sleep(randomDelay(200, 500));
    await page.click("#custom-switch-googleMail");

    const generateButtonSelector = "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.justify-content-md-center.row > div > button";
    await page.waitForSelector(generateButtonSelector, { timeout: globalConfig.timeouts.waitForSelector });
    await page.click(generateButtonSelector);
    await sleep(randomDelay(200, 500));
    await page.click(generateButtonSelector);
    await sleep(randomDelay(500, 1000));

    const emailInputSelector = "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.mb-3.input-group > input";
    await page.waitForSelector(emailInputSelector, { timeout: globalConfig.timeouts.waitForSelector });
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
    if (globalConfig.logErrors) {
      console.error("Error in generateEmail:", error);
    }
    return null;
  }
}

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

    await page.goto(url + "/inbox#" + email, { waitUntil: 'networkidle2', timeout: globalConfig.timeouts.navigation });

    if (globalConfig.simulateHumanBehavior) {
      await simulateScrolling(page);
      await randomMouseMovements(page);
      await sleep(randomDelay(1000, 3000));
    }

    await handleCookieConsent(page);

    await sleep(randomDelay(500, 1500));

    await page.waitForSelector("div.mb-3.col-lg-6.col-sm-12 table.message_container", { timeout: globalConfig.timeouts.waitForSelector });
    const elements = await page.$$("div.mb-3.col-lg-6.col-sm-12 table");

    const contentEmails = await Promise.all(
      elements.map(async (element) => {
        return await element.evaluate((el) => el.innerHTML);
      })
    );

    const hrefLinks = contentEmails.map((content) => {
      const hrefRegex = /href="([^"]*)"/g;
      const hrefMatches = content.matchAll(hrefRegex);
      return Array.from(hrefMatches, (match) => match[1]).filter((href) => href.length > 0);
    });

    const hrefsMails = hrefLinks.filter((href) => href.length > 0);

    const tableRegex = /<table[^>]*>(.*?)<\/table>/g;
    const tableMatches = contentEmails[0].matchAll(tableRegex);
    const tables = Array.from(tableMatches, (match) => match[1]);

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
    if (globalConfig.logErrors) {
      console.error("Error in inbox:", error);
    }
    return null;
  }
}

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

    await page.goto(`https://www.emailnator.com/inbox/${email}/${id}`, { waitUntil: 'networkidle2', timeout: globalConfig.timeouts.navigation });

    if (globalConfig.simulateHumanBehavior) {
      await simulateScrolling(page);
      await randomMouseMovements(page);
      await sleep(randomDelay(1000, 3000));
    }

    await handleCookieConsent(page);

    const mailElements = await page.$$eval(
      "#root > div > section > div > div > div.mb-3.col-lg-6.col-sm-12 > div > div > div.card > div > div",
      (elements) => elements.map((element) => element.innerHTML)
    );

    await browser.close();
    return mailElements;
  } catch (error) {
    if (globalConfig.logErrors) {
      console.error("Error in message:", error);
    }
    return null;
  }
}