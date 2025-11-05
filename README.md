# Evaluador de Fortaleza de Contraseñas y Exposición

Una aplicación web React que analiza la fortaleza de las contraseñas ingresadas por el usuario, implementando principios de seguridad criptográfica y verificando contra bases de datos de filtraciones mediante la API de Have I Been Pwned de forma segura y educativa.

## Características Principales

Esta aplicación proporciona un análisis exhaustivo de contraseñas con un enfoque educativo y centrado en la privacidad del usuario. El análisis de fortaleza se realiza completamente en el navegador del cliente, calculando métricas como entropía, tiempo estimado de crackeo, y verificación de criterios de seguridad estándar incluyendo longitud, diversidad de caracteres, y ausencia de patrones comunes o predecibles.

La verificación contra bases de datos de filtraciones utiliza el modelo k-Anonymity implementado por Have I Been Pwned, garantizando que la contraseña completa nunca abandona el dispositivo del usuario. El proceso hashea la contraseña localmente usando SHA-1, envía únicamente los primeros cinco caracteres del hash al servidor, y realiza la comparación final en el backend sin exponer la contraseña real.

## Arquitectura de Seguridad

La arquitectura del sistema está diseñada con un enfoque de seguridad primero. El análisis de fortaleza se ejecuta enteramente en el navegador usando JavaScript puro, evitando cualquier transmisión innecesaria de datos sensibles. Las métricas calculadas incluyen tamaño del conjunto de caracteres, entropía en bits, y estimaciones de tiempo de crackeo basadas en capacidades de hardware moderno.

La integración con Have I Been Pwned implementa el protocolo k-Anonymity de manera rigurosa. El hash SHA-1 de la contraseña se calcula en el cliente, se extrae el prefijo de cinco caracteres, y solo este prefijo se envía al backend. La función serverless en Vercel consulta la API de HIBP, recibe todos los sufijos que coinciden con el prefijo, y realiza la comparación localmente antes de retornar únicamente un resultado booleano y un conteo al cliente.

## Stack Tecnológico

El frontend está construido con React utilizando hooks modernos como useState, useEffect y useMemo para gestión eficiente de estado y cálculos memoizados. Vite proporciona el entorno de desarrollo y build optimizado con hot module replacement y empaquetado eficiente para producción.

El backend consiste en funciones serverless de Vercel escritas en Node.js. La función de verificación de filtraciones maneja la lógica criptográfica usando el módulo crypto nativo de Node.js para generación de hashes SHA-1, garantizando implementaciones probadas y seguras.

## Instalación y Desarrollo

Para ejecutar el proyecto localmente, primero se deben instalar las dependencias del proyecto. Navegue al directorio del proyecto y ejecute npm install para descargar todos los paquetes requeridos. Una vez completada la instalación, inicie el servidor de desarrollo con npm run dev. La aplicación estará disponible en http://localhost:3000 y se recargará automáticamente cuando realice cambios en el código.

Durante el desarrollo, el frontend de Vite se comunicará con las funciones serverless simuladas localmente. Para testing completo de la integración con HIBP, se recomienda desplegar a Vercel donde las funciones serverless se ejecutarán en el entorno de producción real.

## Despliegue en Vercel

El despliegue en Vercel está optimizado para ser simple y directo. Primero, asegúrese de tener una cuenta en Vercel y la CLI instalada globalmente mediante npm install -g vercel. Desde el directorio raíz del proyecto, ejecute vercel para iniciar el proceso de despliegue. La CLI le guiará a través de la configuración inicial, detectando automáticamente el framework Vite y configurando los ajustes apropiados.

Para despliegues subsecuentes, simplemente ejecute vercel --prod para desplegar directamente a producción. Vercel construirá automáticamente el frontend, desplegará las funciones serverless, y proporcionará una URL de producción donde la aplicación estará inmediatamente disponible con SSL automático y CDN global.

La configuración en vercel.json define los headers de seguridad apropiados incluyendo X-Content-Type-Options, X-Frame-Options, y políticas de cache estrictas para las rutas de API. Las funciones serverless están configuradas con límites de memoria de 1024MB y timeout máximo de 10 segundos para garantizar respuestas rápidas.

## Principios de Seguridad Implementados

El desarrollo de esta aplicación siguió estrictos principios de seguridad en cada decisión de diseño. La validación de entrada es exhaustiva tanto en el cliente como en el servidor, rechazando cualquier dato que no cumpla con las especificaciones esperadas. Las longitudes de contraseña están limitadas a rangos razonables para prevenir ataques de denegación de servicio mediante entradas extremadamente largas.

El manejo de errores está diseñado para no exponer información sensible del sistema. Los errores internos se registran en el servidor pero al cliente solo se retornan mensajes genéricos y seguros. Las respuestas de API incluyen headers de seguridad estándar para prevenir ataques comunes como XSS, clickjacking, y MIME type sniffing.

La implementación del modelo k-Anonymity garantiza privacidad matemática. Incluso si un atacante interceptara el tráfico de red, solo vería un prefijo de hash de cinco caracteres que corresponde a cientos de miles de contraseñas posibles, haciendo imposible determinar la contraseña original del usuario.

## Experiencia de Usuario Educativa

La interfaz está diseñada con un enfoque empático y educativo. En lugar de simplemente calificar contraseñas como "débiles" o "fuertes", la aplicación proporciona explicaciones claras sobre por qué una contraseña alcanza cierta puntuación y ofrece recomendaciones específicas y accionables para mejorarla.

Las visualizaciones incluyen barras de progreso codificadas por color, métricas comprensibles de tiempo de crackeo expresadas en unidades naturales, y una checklist visual de criterios de seguridad. Cada elemento de la interfaz está diseñado para empoderar al usuario con conocimiento sobre seguridad de contraseñas sin abrumarlo con jerga técnica.

La sección de verificación de exposición incluye explicaciones claras sobre qué significa que una contraseña aparezca en filtraciones y cómo funciona el proceso de verificación preservando privacidad. Los usuarios pueden aprender sobre k-Anonymity y principios criptográficos de manera accesible mientras evalúan sus contraseñas.

## Mantenimiento y Extensibilidad

El código está estructurado para facilitar mantenimiento y extensiones futuras. Los componentes React están bien separados con responsabilidades claras. Las funciones auxiliares de análisis de contraseñas están aisladas y pueden ser fácilmente actualizadas con nuevos criterios o algoritmos mejorados.

Las funciones serverless son independientes y stateless, permitiendo escalado horizontal automático por parte de Vercel. La configuración está centralizada en archivos dedicados, simplificando ajustes de seguridad, performance o límites de recursos.

Para agregar nuevas características como análisis de frases de contraseña, integración con otros servicios de seguridad, o generación de contraseñas seguras, la arquitectura actual proporciona una base sólida que respeta los principios de seguridad y privacidad establecidos.

## Licencia y Uso

Este proyecto es una herramienta educativa diseñada para ayudar a usuarios a comprender y mejorar la seguridad de sus contraseñas. El código puede ser usado, modificado y distribuido libremente, manteniendo siempre el enfoque en privacidad y seguridad del usuario.

Los datos de verificación de exposición provienen de Have I Been Pwned, un servicio gratuito creado y mantenido por Troy Hunt. Se debe respetar los términos de uso de su API y considerar contribuciones al proyecto si se implementa en producción con alto volumen de tráfico.
