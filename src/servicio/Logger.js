const fs = require('fs');
const path = require('path');

class Logger {
    constructor() {
        this.logDir = './logs';
        // Nombre del archivo basado en la fecha actual (ej: 2026-01-21.log)
        const fecha = new Date().toISOString().split('T')[0];
        this.logFile = path.join(this.logDir, `${fecha}.log`);
        
        // Crear carpeta de logs si no existe
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    /**
     * Escribe en pantalla y en el archivo. 
     * @param {string} msg - El mensaje a loguear
     * @param {boolean} newLine - Si debe añadir salto de línea (por defecto true)
     */
    info(msg, newLine = true) {
        const mensaje = msg + (newLine ? '\n' : '');
        
        // 1. Mostrar en pantalla (tu consola actual)
        process.stdout.write(mensaje);

        // 2. Guardar en el archivo (añadiendo timestamp solo al inicio de líneas nuevas)
        const timestamp = newLine ? `[${new Date().toLocaleTimeString()}] ` : '';
        fs.appendFileSync(this.logFile, timestamp + mensaje);
    }
}

module.exports = new Logger();