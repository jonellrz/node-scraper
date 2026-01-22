const { guardarFichero, extraerLinks, construirUrl, obtenerResultadosDeBusqueda } = require('../utileria');
const { 
    FICHERO_ENLACES, 
    TIEMPO_ESPERA, 
    REINTENTOS, 
    SELECTOR_CARRO, 
    URL_DOM
} = require('../config/constantes');
const { navegador, autoScroll } = require('../servicio/navegador');
const Logger = require('../servicio/Logger');



/**
 * Proceso principal de recolección de enlaces
 */
async function obtenerEnlacesByCss(urlSemilla) {
    const inicio = new Date();
    Logger.info(`>>> Inicio del proceso de enlaces: ${inicio.toLocaleTimeString()}.`, true);
    
    const { browser, page } = await navegador();
    let allLinks = [];
    let pageNum = 1;
    let sigue = true;
    let totalAcumulado = 0;
    let _rein = REINTENTOS;

    try {
        while (sigue) {
            const url = construirUrl(urlSemilla, pageNum);
            
            // Log de reintentos o progreso estándar
            if (_rein !== REINTENTOS) {
                Logger.info(`\r- Página ${pageNum}: [😕 reintento ${REINTENTOS - _rein}] `, false);
            } else Logger.info(`- Página ${pageNum}:`, false);

            await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
            
            Logger.info(' [ ⬇️  Scroll web ]', false);
            await autoScroll(page);
            
            Logger.info(` [ 👀 Esperando ${TIEMPO_ESPERA}ms ]`, false);
            await page.waitForTimeout(TIEMPO_ESPERA); 

            // Extracción y limpieza de duplicados en la página
            const links = await extraerLinks(page, SELECTOR_CARRO);

            // console.log('links', links)

            const totalPage = links.length;
            let totalReal = 0;
            const enlaces = {};

            links.forEach(lnk => {
                const id = lnk.split('/').pop()
                if (!enlaces[id]) {
                    enlaces[id] = lnk;
                    totalReal++;
                }
            });

            // Lógica de validación: si hay pocos links, reintenta
            if (18 < totalPage || _rein <= 0) {
                _rein = REINTENTOS;
                
                if (links.length === 0) {
                    Logger.info(`\r- Página ${pageNum}: 🛑 No hay más autos.`);
                    sigue = false;
                } else {
                    const datosPagina = { 
                        pagina: pageNum, 
                        total: totalPage, 
                        totalReal: totalReal, 
                        enlaces: enlaces,
                    };
                    
                    allLinks.push(datosPagina);
                    totalAcumulado = allLinks.reduce((acc, curr) => acc + curr.totalReal, 0);
                    Logger.info(` ... ✅ :: ${totalReal} links (Total: ${totalAcumulado})`);
                    
                    // Guardado preventivo en cada página
                    guardarFichero(FICHERO_ENLACES, allLinks);
                    pageNum++;
                }
            } else {
                _rein--; // Disminuir intentos si la página no cargó completa
            }
        }
    } catch (error) {
        Logger.info("\n===========> ❌ Error en el proceso:", error.message);
    } finally {
        await browser.close();
        const fin = new Date();
        Logger.info(`<<< Fin proceso enlaces: ${fin.toLocaleTimeString()} con ${totalAcumulado} enlaces`, true);
    }
}


/**
 * Proceso principal de recolección de enlaces
 */
async function obtenerEnlaces(urlSemilla) {
    const inicio = new Date();
    Logger.info(`>>> Inicio del proceso de enlaces: ${inicio.toLocaleTimeString()}.`, true);
    
    const { browser, page } = await navegador();
    let bdJS = [];
    let pageNum = 1;
    let sigue = true;
    let totalAcumulado = 0;
    let _rein = REINTENTOS;

    try {
        while (sigue) {
            Logger.info(`- Página ${pageNum}:`, false);

            const enlace = construirUrl(urlSemilla, pageNum);

            await page.addInitScript(() => {
                window.__DATOS_CAPTURADOS__ = [];
                // Creamos el objeto si no existe
                window.self.__next_f = {
                    push: (array) => {
                        // Guardamos cada fragmento que Next.js intenta "empujar"
                        window.__DATOS_CAPTURADOS__.push(array);
                    }
                };
            });

            await page.goto(enlace, { waitUntil: 'networkidle' });
            
            Logger.info(` [ 👀 Esperando ${TIEMPO_ESPERA}ms ]`, false);
            await page.waitForTimeout(TIEMPO_ESPERA); 

            Logger.info(` [ 🤖 Cargando Scripts ]`, false);
            const fragmentos = await page.evaluate(() => window.__DATOS_CAPTURADOS__);
            const contenidoTotal = fragmentos.map(f => f[1]).join('');

            Logger.info(` [ Resultado: `, false);
            let listado = obtenerResultadosDeBusqueda(contenidoTotal)
            const total = listado.length;
            Logger.info(` ${total}} enlaces ]`, false);

            listado = listado.map(dta => {
                return {
                    enlace: URL_DOM + dta.announcement.slug,
                    datos: dta
                };
            });

            if (total === 0) {
                Logger.info(`\r- Página ${pageNum}: 🛑 No hay más autos.`);
                sigue = false;
            } else {
                const datosPagina = { 
                    pagina: pageNum, 
                    total: total, 
                    enlaces: listado,
                };

                bdJS.push(datosPagina);
                totalAcumulado = bdJS.reduce((acc, curr) => acc + curr.total, 0);
                Logger.info(` ... ✅ :: (Acumulando: ${totalAcumulado})`);
                
                // Guardado preventivo en cada página
                guardarFichero(FICHERO_ENLACES, bdJS);
                pageNum++;
            }
        }
    } catch (error) {
        Logger.info("\n===========> ❌ Error en el proceso:", error.message);
    } finally {
        await browser.close();
        const fin = new Date();
        Logger.info(`<<< Fin proceso enlaces: ${fin.toLocaleTimeString()} con ${totalAcumulado} enlaces`, true);
    }
}

module.exports = { obtenerEnlaces, obtenerEnlacesByCss };