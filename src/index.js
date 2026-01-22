const readline = require('readline');
const { obtenerEnlaces, obtenerEnlacesByCss } = require('./logica/enlaces');
const { URL_BASE, FICHERO_ENLACES } = require('./config/constantes');
const { leerFichero } = require('./utileria');
const { obtenerCarro } = require('./logica/carros');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });

async function main() {
    console.log('\n--- 🚗 SCRAPER MENU ---');
    // console.log('1. Descargar enlaces por CSS');
    console.log('2. Descargar enlaces por Objetos');
    console.log('3. Ver total de enlaces');
    // console.log('4. Limpiar enlaces');
    console.log('5. Descargar carros (Fichas)');
    // console.log('6. Buscar carro');
    // console.log('7. Limpiar carros');
    console.log('0. Salir');

    rl.question('\nSeleccione opción: ', async (opt) => {
        // if (opt === '1') {
        //     await obtenerEnlacesByCss(URL_BASE);
        // } else
             if (opt === '2') {
            await obtenerEnlaces(URL_BASE);
        } else if (opt === '3') {
            const data = leerFichero(FICHERO_ENLACES);
            const total = data.reduce((acc, p) => acc + Object.keys(p.enlaces).length, 0);
            console.log(`\n📊 Total de enlaces acumulados: ${total}`);
        } else if (opt === '4') {
            // if (fs.existsSync(FICHERO_ENLACES)) fs.unlinkSync(FICHERO_ENLACES);
            // console.log('\n🗑️ Enlaces borrados.');
        } else if (opt === '5') {
            await obtenerCarro();
        } else if (opt === '0') {
            process.exit();
        }
        main(); // Volver al menú
    });
}

main();