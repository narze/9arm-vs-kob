import puppeteer from "puppeteer";
import fs from "fs";
import axios from "axios";

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

async function fetchPreviousHistory(): Promise<Record<string, any>[]>{
  try {
    const response = await axios.get("https://9arm-vs-kob-api.vercel.app/history.json");
    if(response.data === null || response.data.history === undefined ) return [];
    return response.data.history;
  } catch (error) {
    return [];
  }
}


const browser = await puppeteer.launch();

const group9arm = await getMembers("9arm.community");
const groupKob = await getMembers("thaidev");
const diff = group9arm - groupKob;

await browser.close();

const data = { group9arm, groupKob, diff, updatedAt: new Date().toISOString() };
console.log(data);

await writeFile(data);

const history = await fetchPreviousHistory();
const lastDataFromHistory  = history[history.length - 1]; 

if( lastDataFromHistory && data.diff === lastDataFromHistory.diff){
  console.log("Same data no update.");
}else{
  console.log("Updating history.");
  history.push(data);
  const slicedHistory = history.slice(-5);
  await writeHistoryFile(slicedHistory);
}
