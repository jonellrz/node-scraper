const { chromium } = require('playwright');
const fs = require('fs');

const URL_BASE = ""
const TIME_OUT = 2500

// const SELECTOR_CARRO = 'a.box-border.w-full.text-neutral-extreme[href*="/auto/"]'
// const SELECTOR_CARRO = 'a.relative.block.h-\\[156px\\]';
const SELECTOR_CARRO = 'a.text-neutral-extreme[href]';

/**
<ul class="flex flex-shrink-0 select-none gap-medium font-neurial text-label-medium font-normal text-neutral-extreme" role="navigation" aria-label="Pagination">
 */


/**
 * Función para configurar el navegador y la página
 */
async function configurarNavegador() {
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        viewport: { width: 1920, height: 1080 }
    });
    
    const page = await context.newPage(); // await browser.newPage();
    
    // Quitar huella de automatización
    await page.addInitScript(() => {
        Object.defineProperty(navigator, 'webdriver', { get: () => undefined });
    });

    return { browser, page };
}

/**
 *  Función para manejar el scroll de la página
 */
async function autoScroll(page) {
    await page.evaluate(async () => {
        await new Promise((resolve) => {
            let totalHeight = 0;
            let distance = 100; // Baja de 100 en 100 píxeles
            let timer = setInterval(() => {
                let scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                // Si llegamos al final, esperamos un poco y terminamos
                if (totalHeight >= scrollHeight) {
                    clearInterval(timer);
                    resolve();
                }
            }, 100); // Velocidad del scroll (100ms)
        });
    });
}

/**
 * Extraer los links del DOM
 */
async function extraerLinks(page, selector) {
    return await page.$$eval(selector, anchors => anchors.map(a => a.href));
}

/**
 * Generar la URL con paginación correcta
 */
function construirUrl(urlBase, pageNum) {
    const conector = urlBase.includes('?') ? '&' : '?';
    return `${urlBase}${pageNum>1 ? conector + 'page='+pageNum : '' }`
}

async function MAIN(urlSemilla) {
    const inicio = new Date(); // Captura fecha y hora actual
    console.log(`🏁 Inicio del proceso: ${inicio.toLocaleTimeString()}. \n`);
    const { browser, page } = await configurarNavegador();
    let allLinks = [];
    let pageNum = 1;
    let keepGoing = true;
    let totalAcumulado = 0
    let reintentos = 5

    try {
        while (keepGoing) {
            const url = construirUrl(urlSemilla, pageNum);
            if (reintentos !== 5) {
                process.stdout.write(`\r- Página ${pageNum}: [😕 reintento ${5-reintentos}] `);
                // console.log(`--- ---- 😕 ${5-reintentos} Reintento ..............`);
            } else {
                process.stdout.write(`- Página ${pageNum}:`);
            }
            // console.log(`\n📄 [Página ${pageNum}] Cargando: ${url}`);
            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            // Scroll y espera
            process.stdout.write(' [ ⬇️  Scroll web ]');
            // console.log("--- ⬇️  Haciendo scroll para cargar todos los items...");

            process.stdout.write(` [ 👀 Esperando ${TIME_OUT}ms que carga ]`);
            await autoScroll(page);
            // console.log(`--- 👀 Esperando [${TIME_OUT}] a que cargue todo...`);
            await page.waitForTimeout(TIME_OUT ); 

            //  ================================= EXTRAE LINKS DE AUTOS
            const links = await extraerLinks(page, SELECTOR_CARRO);
            const totalPage = links.length

             // si no lo es reintenta la misma pagina
            if (18 < totalPage || reintentos <= 0) {
                reintentos = 5;
                if (links.length === 0) {
                    process.stdout.write(`\r- Página ${pageNum}: 🛑 No hay más autos.`);
                    // console.log("\n ===========> 🛑 No hay más autos. Finalizando...");
                    keepGoing = false;
                } else {
                    const datosPagina = {
                        pagina: pageNum,
                        total: totalPage,
                        links: links,
                    };
                    allLinks.push(datosPagina);
                    // allLinks = allLinks.concat(links);
                    totalAcumulado = allLinks.reduce((acc, item) => acc + item.links.length, 0);
                    process.stdout.write(` ... ✅ :: ${links.length} links (En BD: ${totalAcumulado})`);
                    // console.log(`--- ✅ Cargada página ${pageNum}: ${totalPage} links (Total BD: ${totalAcumulado})`);
                    
                    // Guardado preventivo
                    fs.writeFileSync('./data/links_acumulados.json', JSON.stringify(allLinks, null, 2));
                    pageNum++;
                }
                process.stdout.write(`\n`);
            } else {
                reintentos--;
            }
        }
    } catch (error) {
        console.error("===========> ❌ Error en el proceso:", error.message);
    } finally {
        await browser.close();
        const fin = new Date();
        const diferenciaMs = fin - inicio; // Diferencia en milisegundos
        const totalSegundos = Math.floor(diferenciaMs / 1000);
        const minutos = Math.floor(totalSegundos / 60);
        const segundos = totalSegundos % 60;

        console.log("\n\n" + "=".repeat(60));
        console.log(`🏁 Fin del proceso: ${fin.toLocaleTimeString()} con ${totalAcumulado} links.`);
        console.log(`⏳ Tiempo total: ${minutos} min ${segundos} seg`);
        console.log("=".repeat(60) + "\n\n");
    }
}


MAIN(URL_BASE);