const express = require('express');
const puppeteer = require('puppeteer');
const axios = require('axios');
const app = express();
require('dotenv').config();

const DIRECTUS_API_URL = 'https://directus-production-b9a7.up.railway.app';
const DIRECTUS_API_KEY = process.env.DIRECTUS_API_KEY ;

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const getSearchTerms = async () => {
  try {
    const response = await axios.get(`${DIRECTUS_API_URL}/items/termos_pesquisa?limit=3`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_API_KEY}`
      }
    });
    return response.data.data;
  } catch (error) {
    console.error('Error fetching search terms:', error);
    return [];
  }
};

const saveResult = async (endpoint, data) => {
  try {
    await axios.post(`${DIRECTUS_API_URL}/items/${endpoint}`, data, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {s
    console.error(error.data.errors);
  }
};

const deleteSearchTerm = async (id) => {
  try {
    await axios.delete(`${DIRECTUS_API_URL}/items/termos_pesquisa/${id}`, {
      headers: {
        Authorization: `Bearer ${DIRECTUS_API_KEY}`
      }
    });
  } catch (error) {
    console.error('Error deleting search term:', error);
  }
};

const extractEmailsAndSites = async (html) => {
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const siteRegex = /www\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  const emails = html.match(emailRegex) || [];
  const sites = html.match(siteRegex) || [];
  return { emails, sites };
};

const scrapeGoogle = async (page, term, city, state, site) => {
  console.log(`Iniciando busca para o termo: ${term}, cidade: ${city}, estado: ${state}, site: ${site}`);
  
  let allEmails = [];
  let allSites = [];

  for (let start = 0; start < 100; start += 10) {
    const query = `${term} ${city} ${state} ${site} emails`;
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&start=${start}`;
    
    await page.goto(url, { waitUntil: 'networkidle2' });
    console.log(`Acessando URL: ${url}`);

    const html = await page.evaluate(() => document.body.innerHTML);

    const { emails, sites } = await extractEmailsAndSites(html);

    const uniqueEmails = [...new Set(emails)];
    const uniqueSites = [...new Set(sites)];

    console.log(`Página ${start / 10 + 1} processada. Emails encontrados: ${emails.length}`);

      for (const email of uniqueEmails) {
        await saveResult('emails', { email });
      }
  
      for (const site of uniqueSites) {
        await saveResult('sites', { site });
      }

    allEmails = allEmails.concat(uniqueEmails);
    allSites = allSites.concat(uniqueSites);

    await delay(60000); // Delay de 60 segundos entre cada página
  }

  return { allEmails, allSites };
};

const main = async () => {
  const searchTerms = await getSearchTerms();
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();

  for (const term of searchTerms) {
    const { termo, cidade, estado, site, id } = term;

    const { allEmails, allSites } = await scrapeGoogle(page, termo, cidade, estado, site);

    await deleteSearchTerm(id);

    console.log(`Termo de pesquisa ${termo} concluído. Aguardando 10 minutos antes de iniciar o próximo termo.`);
    await delay(600000); 
  }

  await browser.close();
  console.log('Todas as buscas foram concluídas. Navegador fechado.');
};

app.get('/', async (req, res) => {
  try {
    await main();
    res.status(200).send('Scraping completed successfully');
  } catch (error) {
    console.error('Error running scraper:', error);
    res.status(500).send('Error running scraper');
  }
});

app.listen(process.env.PORT, () => {
  console.log(`Scraper API listening at http://localhost:${process.env.PORT}`);
});
