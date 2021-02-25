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
    fs.writeFile("./data.json", JSON.stringify(data, null, 2), "utf8", resolve);
  });
}

const browser = await puppeteer.launch();

const group9arm = await getMembers("9arm.community");
const groupKob = await getMembers("thaidev");
const diff = group9arm - groupKob;

await browser.close();

const data = { group9arm, groupKob, diff };
console.log(data);

await writeFile(data);
