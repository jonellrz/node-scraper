const fs = require('fs');
const path = require('path');

const buscarPropiedad = (prop, texto, coincidencia = 1) => {
    const _txt = texto.replace(/\\"/g, '"');
    let regex;
    
    // CASO A: Sub-objetos (ej: contact.name)
    if (prop.includes('.')) {
        const [padre, hijo] = prop.split('.');
        regex = new RegExp(`"${padre}"\\s*:\\s*\\{[^}]*?"${hijo}"\\s*:\\s*(?:"([^"]*)"|(\\d+))`, 'gi');
    } 
    // CASO B: Ficha técnica o Propiedad directa
    else {
        const regexObjeto = new RegExp(`"(?:key|name)"\\s*:\\s*"${prop}"\\s*,\\s*"value"\\s*:\\s*(?:"([^"]*)"|(\\d+))`, 'gi');
        let matches = [..._txt.matchAll(regexObjeto)];
        
        if (matches.length >= coincidencia) {
            const m = matches[coincidencia - 1];
            return m[1] || m[2]; // Retorna el texto o el número
        }

        regex = new RegExp(`"${prop}"\\s*:\\s*(?:"([^"]*)"|(\\d+))`, 'gi');
    }

    const matches = [..._txt.matchAll(regex)];
    const match = matches[coincidencia - 1];

    if (match) {
        // match[1] es el valor si tenía comillas, match[2] si era número puro
        return (match[1] || match[2] || '').trim();
    }

    return null;
};

const leerFichero = (ruta) => {
    try {
        const carpeta = path.dirname(ruta);
        if (!fs.existsSync(carpeta))  fs.mkdirSync(carpeta, { recursive: true });
        if (!fs.existsSync(ruta)) return [];
        const contenido = fs.readFileSync(ruta, 'utf8');
        return JSON.parse(contenido);
    } catch (error) {
        console.error(`⚠️ Error al leer ${ruta}:`, error.message);
        return [];
    }
};

const guardarFichero = (ruta, data) => {
    try {
        const carpeta = path.dirname(ruta);
        if (!fs.existsSync(carpeta))  fs.mkdirSync(carpeta, { recursive: true });
        fs.writeFileSync(ruta, JSON.stringify(data, null, 2));
    } catch (error) {
        console.error(`❌ Error al guardar en ${ruta}:`, error.message);
    }
};

async function extraerLinks(page, selector) {
    return await page.$$eval(selector, anchors => anchors.map(a => a.href));
}

function construirUrl(urlBase, pageNum) {
    const conector = urlBase.includes('?') ? '&' : '?';
    return `${urlBase}${pageNum>1 ? conector + 'page='+pageNum : '' }`
}


module.exports = { 
    buscarPropiedad, leerFichero, 
    guardarFichero, extraerLinks, 
    construirUrl 
};