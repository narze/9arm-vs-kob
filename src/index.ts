import puppeteer from "puppeteer";
import fs from "fs";

async function getMembers(pageName: string): Promise<number> {
  const url = `https://en-gb.facebook.com/groups/${pageName}/about`;

  const page = await browser.newPage();
  await page.goto(url, { waitUntil: "networkidle2" });

  const element = await page.evaluateHandle(() =>
    Array.from(document.querySelectorAll("div > span")).find((a) =>
      /total members/i.test(a.textContent as string)
    )
  );
  const innerText = await element.getProperty("innerText");
  const members = +((await innerText!.jsonValue()) as string)
    .replace(",", "")
    .match(/\d+/)![0];

  page.close();
  return members;
}

async function writeFile(data: Record<string, any>) {
  return new Promise((resolve) => {
    fs.writeFile(
      "./public/data.json",
      JSON.stringify(data, null, 2),
      "utf8",
      resolve
    );
  });
}

async function writeHistoryFile(data: Record<string, any>) {
  return new Promise((resolve) => {
    fs.writeFile(
      "./public/history.json",
      JSON.stringify(data, null, 2),
      "utf8",
      resolve
    );
  });
}

async function fetchPreviousHistory(): Promise<Record<string, any>[]> {
  return new Promise((resolve) => {
    fs.readFile("./public/history.json", "utf8", (err, data) => {
      if (err) return resolve([]);
      const json = JSON.parse(data);
      if (json["history"] === undefined) return resolve([]);
      return resolve(json["history"]);
    });
  });
}

const browser = await puppeteer.launch();

const group9arm = await getMembers("9arm.community");
const groupKob = await getMembers("thaidev");
const diff = group9arm - groupKob;

await browser.close();

const historyLimit = 100;
const history = await fetchPreviousHistory();
const lastDataFromHistory = history[history.length - 1];
const data = {
  group9arm,
  groupKob,
  diff,
  updatedAt: new Date().toISOString(),
  diffChanged: 0,
};

if (lastDataFromHistory) {
  data.diffChanged = diff - lastDataFromHistory.diff;
}

console.log(data);

await writeFile(data);

if (
  lastDataFromHistory &&
  data.group9arm === lastDataFromHistory.group9arm &&
  data.groupKob === lastDataFromHistory.groupKob
) {
  console.log("Same data no update.");
} else {
  console.log("Updating history.");
  history.push(data);
  const slicedHistory = history.slice(-historyLimit);
  await writeHistoryFile({ history: slicedHistory });
}
