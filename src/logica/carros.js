const { FICHERO_ENLACES, FICHERO_CARROS } = require('../config/constantes');
const Logger = require('../servicio/Logger');
const { navegador } = require('../servicio/navegador');
const { leerFichero, buscarPropiedad, guardarFichero } = require('../utileria');

/**
 * Proceso principal de recolección de carros
 */
async function obtenerCarro() {
    const inicio = new Date();
    console.log('\n')
    Logger.info(`>>> Inicio obtener carros [${inicio.toLocaleTimeString()}]`, true)
    
    const { browser, page } = await navegador();
    const paginas = await leerFichero(FICHERO_ENLACES)
    let todos = [];
    let cont = 1
    for (const pagina of paginas) {
        for (const enlace of Object.values(pagina.enlaces)) {

            try {
                
             // leer los scripts
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

                const fragmentos = await page.evaluate(() => window.__DATOS_CAPTURADOS__);
                // juntamos en un unico texto los scripts
                const contenidoTotal = fragmentos.map(f => f[1]).join('');

                const datoCarro = {}
                
                datoCarro['titulo'] = buscarPropiedad('title', contenidoTotal, 2);
                datoCarro['vendedor'] = buscarPropiedad('contact.name', contenidoTotal);
                datoCarro['vendedorCel'] = buscarPropiedad('contact.phone', contenidoTotal);
                datoCarro['vistas'] = buscarPropiedad('advertisementViews', contenidoTotal);
                datoCarro['modelo'] = buscarPropiedad('Modelo', contenidoTotal);
                datoCarro['photo'] = buscarPropiedad('xlarge', contenidoTotal);
                datoCarro['photo2'] =  buscarPropiedad('xlarge', contenidoTotal, 2);
                datoCarro['price'] = buscarPropiedad('price', contenidoTotal, 3);
                datoCarro['departamento'] = buscarPropiedad('departamento', contenidoTotal);
                datoCarro['provincia'] = buscarPropiedad('provincia', contenidoTotal);
                datoCarro['distrito'] = buscarPropiedad('distrito', contenidoTotal);
                datoCarro['AñoModelo'] = buscarPropiedad('Año Modelo', contenidoTotal);
                datoCarro['AñoFabricación'] = buscarPropiedad('Año de fabricación', contenidoTotal);
                datoCarro['kilometraje'] = buscarPropiedad('kilometraje', contenidoTotal);
                datoCarro['transmision'] = buscarPropiedad('transmision', contenidoTotal);
                datoCarro['description'] = buscarPropiedad('description', contenidoTotal);

                todos.push(datoCarro);
                // Guardado preventivo en cada carro
                guardarFichero(FICHERO_CARROS, todos);
                
                Logger.info(`- Carro [${cont}]: ${datoCarro['titulo']} [Página:${pagina.pagina}]`, true)

            } catch (error) {
                Logger.info(`- Carro [${cont}]:: ❌❌ ERROR :: [Página:${pagina.pagina}] [error: ${error}]`, true)
                
            } finally {
                cont++
            }
        }
    }

    const fin = new Date();
    Logger.info(`<<< Fin obtener carros [${fin.toLocaleTimeString()}] con ${todos.length} carros.`, true)
}

module.exports = { obtenerCarro };