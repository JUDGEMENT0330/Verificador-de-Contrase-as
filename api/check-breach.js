import crypto from 'crypto';

// Validación de entrada con principios de seguridad
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    throw new Error('Contraseña inválida');
  }
  
  if (password.length < 1 || password.length > 1000) {
    throw new Error('Longitud de contraseña inválida');
  }
  
  return true;
}

// Función para hashear contraseña con SHA-1 (requerido por HIBP)
function hashPassword(password) {
  return crypto
    .createHash('sha1')
    .update(password)
    .digest('hex')
    .toUpperCase();
}

// Verificar contraseña contra API de Have I Been Pwned usando k-Anonymity
async function checkPasswordPwned(password) {
  try {
    // 1. Validar entrada
    validatePassword(password);
    
    // 2. Hashear la contraseña localmente
    const hash = hashPassword(password);
    
    // 3. Extraer los primeros 5 caracteres (k-Anonymity prefix)
    const prefix = hash.substring(0, 5);
    const suffix = hash.substring(5);
    
    // 4. Consultar la API de HIBP solo con el prefijo
    const response = await fetch(
      `https://api.pwnedpasswords.com/range/${prefix}`,
      {
        headers: {
          'User-Agent': 'Password-Evaluator-App',
          'Add-Padding': 'true' // Mejor privacidad con padding
        }
      }
    );
    
    if (!response.ok) {
      throw new Error(`HIBP API error: ${response.status}`);
    }
    
    const data = await response.text();
    
    // 5. Procesar respuesta en el servidor (no en el cliente)
    // La respuesta contiene sufijos de hashes que coinciden con el prefijo
    const hashes = data.split('\n');
    
    for (const line of hashes) {
      const [hashSuffix, count] = line.split(':');
      
      // 6. Comparar el sufijo de nuestro hash con los resultados
      if (hashSuffix === suffix) {
        return {
          exposed: true,
          count: parseInt(count, 10)
        };
      }
    }
    
    // No se encontró en la base de datos
    return {
      exposed: false,
      count: 0
    };
    
  } catch (error) {
    console.error('Error checking password:', error);
    throw error;
  }
}

// Handler principal de la función serverless
export default async function handler(req, res) {
  // Configurar CORS de manera segura
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  // Manejar preflight OPTIONS request
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Solo permitir POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      error: 'Método no permitido',
      message: 'Solo se permiten solicitudes POST'
    });
  }
  
  try {
    // Extraer y validar el cuerpo de la solicitud
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({
        error: 'Solicitud inválida',
        message: 'Se requiere el campo password'
      });
    }
    
    // Verificar la contraseña contra HIBP
    const result = await checkPasswordPwned(password);
    
    // Retornar resultado
    return res.status(200).json({
      exposed: result.exposed,
      count: result.count,
      checked: true
    });
    
  } catch (error) {
    console.error('Error in check-breach handler:', error);
    
    // No exponer detalles internos del error al cliente
    return res.status(500).json({
      error: 'Error interno del servidor',
      message: 'No se pudo completar la verificación. Por favor, intenta de nuevo.'
    });
  }
}

// Configuración de la función serverless
export const config = {
  runtime: 'nodejs',
  maxDuration: 10, // Timeout de 10 segundos
};