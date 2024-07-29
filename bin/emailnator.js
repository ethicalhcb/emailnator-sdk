import puppeteer from "puppeteer-extra";
import StealthPlugin from "puppeteer-extra-plugin-stealth";
import UserAgent from "user-agents";

const userAgent = new UserAgent({ deviceCategory: "desktop" });

const sleep = (ms = 500) => new Promise((r) => setTimeout(r, ms));
const url = "https://www.emailnator.com";

puppeteer.use(StealthPlugin());

/**
 * generate email address from emailnator.com
 * @returns email
 */
export async function generateEmail() {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
      headless: false,
    });
    const page = await browser.newPage();

    await Promise.all([
      page.setUserAgent(userAgent.toString()),
      page.setCacheEnabled(false),
      page.setOfflineMode(false),
      page.setBypassServiceWorker(true),
      page.setRequestInterception(true),
      page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      }),
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (["image", "stylesheet", "font", "medias"].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      }),
    ]);

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    await page.setUserAgent(userAgent.toString());

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", {
        get: () => false,
      });
    });

    await page.goto(url);

    await page.waitForSelector(".fc-button-background");
    await page.click(".fc-button-background");

    await page.waitForSelector("#custom-switch-domain");
    await page.waitForSelector("#custom-switch-plusGmail");
    await page.waitForSelector("#custom-switch-googleMail");

    await page.click("#custom-switch-domain");
    await sleep(300);
    await page.click("#custom-switch-plusGmail");
    await sleep(300);
    await page.click("#custom-switch-googleMail");

    await page.waitForSelector(
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.justify-content-md-center.row > div > button"
    );
    await page.click(
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.justify-content-md-center.row > div > button"
    );
    await sleep(300);
    await page.click(
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.justify-content-md-center.row > div > button"
    );
    await sleep(300);

    await page.waitForSelector(
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.mb-3.input-group > input"
    );
    const element = await page.$(
      "#root > div > main > div.homepage--top > div > div > div > div.mb-3.card > div > div.mb-3.input-group > input"
    );

    if (element !== null) {
      const text = await (await element.getProperty("value")).jsonValue();

      if (!text.endsWith("@gmail.com") && !text.includes("+")) {
        await page.close();
        await browser.close();
        return null;
      }
      await page.close();
      await browser.close();
      return text;
    } else {
      await page.close();
      await browser.close();
      return null;
    }
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function inbox(email) {
  try {
    const browser = await puppeteer.launch({
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });

    const page = await browser.newPage();

    await Promise.all([
      page.setUserAgent(userAgent.toString()),
      page.setCacheEnabled(false),
      page.setOfflineMode(false),
      page.setBypassServiceWorker(true),
      page.setRequestInterception(true),
      page.evaluateOnNewDocument(() => {
        Object.defineProperty(navigator, "webdriver", { get: () => false });
      }),
      page.on("request", (request) => {
        const resourceType = request.resourceType();
        if (["image", "stylesheet", "font", "medias"].includes(resourceType)) {
          request.abort();
        } else {
          request.continue();
        }
      }),
    ]);

    page.on("dialog", async (dialog) => {
      await dialog.dismiss();
    });

    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    });

    await page.goto(url + "/inbox#" + email);

    await page.waitForSelector(".fc-button-background");
    await page.click(".fc-button-background");

    await sleep();

    await page.waitForSelector(
      "div.mb-3.col-lg-6.col-sm-12 table.message_container"
    );
    const elements = await page.$$("div.mb-3.col-lg-6.col-sm-12 table");

    const contentEmails = await Promise.all(
      elements.map(async (element) => {
        const content = await element.evaluate((el) => el.innerHTML);
        return content;
      })
    );

    const hrefLinks = contentEmails.map((content) => {
      const hrefRegex = /href="([^"]*)"/g;
      const hrefMatches = content.matchAll(hrefRegex);
      const hrefs = Array.from(hrefMatches, (match) => match[1]);

      return hrefs.filter((href) => href.length > 0);
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

    await page.close();
    await browser.close();
    return result;
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function message(id, email) {
  const browser = await puppeteer.launch({
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setUserAgent(userAgent.toString());

  await Promise.all([
    page.setUserAgent(userAgent.toString()),
    page.setCacheEnabled(false),
    page.setOfflineMode(false),
    page.setBypassServiceWorker(true),
    page.setRequestInterception(true),
    page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => false });
    }),
    page.on("request", (request) => {
      const resourceType = request.resourceType();
      if (["image", "stylesheet", "font", "medias"].includes(resourceType)) {
        request.abort();
      } else {
        request.continue();
      }
    }),
  ]);

  page.on("request", (request) => {
    const resourceType = request.resourceType();
    if (["image", "stylesheet", "font", "medias"].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  page.on("dialog", async (dialog) => {
    await dialog.dismiss();
  });

  await page.goto(`https://www.emailnator.com/inbox/${email}/${id}`);

  await page.waitForSelector(".fc-button-background");
  await page.click(".fc-button-background");

  const mailElements = await page.$$eval(
    "#root > div > section > div > div > div.mb-3.col-lg-6.col-sm-12 > div > div > div.card > div > div",
    (elements) => elements.map((element) => element.innerHTML)
  );

  await browser.close();
  return mailElements;
}
