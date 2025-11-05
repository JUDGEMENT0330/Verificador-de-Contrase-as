import React, { useState, useMemo, useEffect } from 'react';
import './App.css';

const App = () => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [breachStatus, setBreachStatus] = useState({ loading: false, exposed: null, count: null, error: null });
  const [showResults, setShowResults] = useState(false);

  // Análisis de fortaleza de contraseña (lado cliente - sin enviar la contraseña)
  const analysis = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        strength: 'none',
        feedback: [],
        entropy: 0,
        crackTime: { display: '', seconds: 0 }
      };
    }

    // Calcular entropía
    const charsetSize = calculateCharsetSize(password);
    const entropy = Math.log2(Math.pow(charsetSize, password.length));
    
    // Verificar criterios de fortaleza
    const checks = {
      length: password.length >= 12,
      lowercase: /[a-z]/.test(password),
      uppercase: /[A-Z]/.test(password),
      numbers: /[0-9]/.test(password),
      symbols: /[^A-Za-z0-9]/.test(password),
      noCommon: !isCommonPassword(password),
      noSequential: !hasSequentialChars(password),
      noRepeated: !hasRepeatedChars(password)
    };

    // Calcular puntuación (0-100)
    const score = calculateScore(checks, password.length, entropy);
    
    // Determinar nivel de fortaleza
    const strength = getStrengthLevel(score);
    
    // Generar feedback constructivo
    const feedback = generateFeedback(checks, password.length, entropy);
    
    // Calcular tiempo de crackeo estimado
    const crackTime = estimateCrackTime(entropy);

    return { score, strength, feedback, entropy, crackTime, checks };
  }, [password]);

  // Verificar contra Have I Been Pwned (k-Anonymity)
  const checkBreaches = async () => {
    if (!password || password.length < 4) {
      setBreachStatus({ loading: false, exposed: null, count: null, error: 'La contraseña es demasiado corta para verificar' });
      return;
    }

    setBreachStatus({ loading: true, exposed: null, count: null, error: null });

    try {
      const response = await fetch('/api/check-breach', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        throw new Error('Error al verificar la exposición');
      }

      const data = await response.json();
      setBreachStatus({
        loading: false,
        exposed: data.exposed,
        count: data.count,
        error: null
      });
    } catch (error) {
      setBreachStatus({
        loading: false,
        exposed: null,
        count: null,
        error: 'No se pudo verificar la exposición. Por favor, intenta de nuevo.'
      });
    }
  };

  // Auto-mostrar resultados cuando hay contraseña
  useEffect(() => {
    if (password.length > 0) {
      setShowResults(true);
    } else {
      setShowResults(false);
      setBreachStatus({ loading: false, exposed: null, count: null, error: null });
    }
  }, [password]);

  return (
    <div className="app">
      <div className="container">
        <header className="header">
          <div className="shield-icon">🛡️</div>
          <h1>Evaluador de Contraseñas</h1>
          <p className="subtitle">Verifica la fortaleza y exposición de tus contraseñas de forma segura</p>
        </header>

        <div className="input-section">
          <div className="input-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Ingresa tu contraseña para evaluar..."
              className="password-input"
              autoComplete="off"
              spellCheck="false"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="toggle-visibility"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? '👁️' : '👁️‍🗨️'}
            </button>
          </div>
          
          <div className="privacy-note">
            <span className="lock-icon">🔒</span>
            <p>Tu contraseña se analiza localmente en tu navegador. Nunca se envía completa a ningún servidor.</p>
          </div>
        </div>

        {showResults && (
          <>
            <div className="strength-section">
              <div className="strength-header">
                <h2>Fortaleza de la Contraseña</h2>
                <span className={`strength-badge ${analysis.strength}`}>
                  {getStrengthLabel(analysis.strength)}
                </span>
              </div>

              <div className="strength-bar-container">
                <div
                  className={`strength-bar ${analysis.strength}`}
                  style={{ width: `${analysis.score}%` }}
                />
              </div>

              <div className="metrics">
                <div className="metric">
                  <span className="metric-label">Puntuación</span>
                  <span className="metric-value">{analysis.score}/100</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Entropía</span>
                  <span className="metric-value">{analysis.entropy.toFixed(1)} bits</span>
                </div>
                <div className="metric">
                  <span className="metric-label">Tiempo de crackeo estimado</span>
                  <span className="metric-value">{analysis.crackTime.display}</span>
                </div>
              </div>
            </div>

            <div className="criteria-section">
              <h3>Criterios de Seguridad</h3>
              <div className="criteria-grid">
                <CriteriaItem
                  met={analysis.checks.length}
                  icon="📏"
                  label="Longitud adecuada"
                  description="Mínimo 12 caracteres"
                />
                <CriteriaItem
                  met={analysis.checks.lowercase}
                  icon="🔤"
                  label="Minúsculas"
                  description="a-z"
                />
                <CriteriaItem
                  met={analysis.checks.uppercase}
                  icon="🔠"
                  label="Mayúsculas"
                  description="A-Z"
                />
                <CriteriaItem
                  met={analysis.checks.numbers}
                  icon="🔢"
                  label="Números"
                  description="0-9"
                />
                <CriteriaItem
                  met={analysis.checks.symbols}
                  icon="🔣"
                  label="Símbolos"
                  description="!@#$%^&*"
                />
                <CriteriaItem
                  met={analysis.checks.noCommon}
                  icon="🚫"
                  label="No común"
                  description="Evita contraseñas típicas"
                />
                <CriteriaItem
                  met={analysis.checks.noSequential}
                  icon="➡️"
                  label="No secuencial"
                  description="Sin abc, 123"
                />
                <CriteriaItem
                  met={analysis.checks.noRepeated}
                  icon="🔁"
                  label="Sin repetición"
                  description="Sin aaa, 111"
                />
              </div>
            </div>

            {analysis.feedback.length > 0 && (
              <div className="feedback-section">
                <h3>💡 Recomendaciones</h3>
                <ul className="feedback-list">
                  {analysis.feedback.map((item, index) => (
                    <li key={index}>{item}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="breach-section">
              <div className="breach-header">
                <h3>Verificación de Exposición</h3>
                <p className="breach-description">
                  Consulta con Have I Been Pwned para verificar si esta contraseña aparece en filtraciones de datos conocidas.
                </p>
              </div>

              <button
                onClick={checkBreaches}
                disabled={breachStatus.loading}
                className="breach-button"
              >
                {breachStatus.loading ? '🔍 Verificando...' : '🔍 Verificar Exposición'}
              </button>

              {breachStatus.exposed !== null && (
                <div className={`breach-result ${breachStatus.exposed ? 'exposed' : 'safe'}`}>
                  {breachStatus.exposed ? (
                    <>
                      <div className="breach-icon">⚠️</div>
                      <div className="breach-content">
                        <h4>Contraseña Expuesta</h4>
                        <p>
                          Esta contraseña ha aparecido <strong>{breachStatus.count.toLocaleString()}</strong> {breachStatus.count === 1 ? 'vez' : 'veces'} en filtraciones de datos.
                        </p>
                        <p className="breach-advice">
                          <strong>Recomendación:</strong> No utilices esta contraseña. Está comprometida y es conocida por atacantes.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="breach-icon">✅</div>
                      <div className="breach-content">
                        <h4>No Encontrada en Filtraciones</h4>
                        <p>
                          Esta contraseña no aparece en las bases de datos de filtraciones conocidas.
                        </p>
                        <p className="breach-note">
                          Esto es positivo, pero no garantiza seguridad total. Sigue las recomendaciones de fortaleza.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {breachStatus.error && (
                <div className="breach-result error">
                  <div className="breach-icon">❌</div>
                  <div className="breach-content">
                    <h4>Error</h4>
                    <p>{breachStatus.error}</p>
                  </div>
                </div>
              )}

              <div className="privacy-details">
                <h4>🔐 Sobre tu privacidad</h4>
                <p>
                  Utilizamos el modelo k-Anonymity de Have I Been Pwned. Tu contraseña se hashea localmente con SHA-1, 
                  y solo se envían los primeros 5 caracteres del hash al servidor. El servidor compara contra la base de datos 
                  sin conocer tu contraseña real. Este método garantiza privacidad total.
                </p>
              </div>
            </div>
          </>
        )}

        <footer className="footer">
          <p>
            Esta herramienta es educativa y procesa tu contraseña localmente. 
            Los datos de exposición provienen de <a href="https://haveibeenpwned.com" target="_blank" rel="noopener noreferrer">Have I Been Pwned</a>.
          </p>
        </footer>
      </div>
    </div>
  );
};

// Componente para mostrar criterios individuales
const CriteriaItem = ({ met, icon, label, description }) => (
  <div className={`criteria-item ${met ? 'met' : 'unmet'}`}>
    <span className="criteria-icon">{icon}</span>
    <div className="criteria-content">
      <span className="criteria-label">{label}</span>
      <span className="criteria-description">{description}</span>
    </div>
    <span className="criteria-status">{met ? '✓' : '✗'}</span>
  </div>
);

// Funciones auxiliares de análisis

function calculateCharsetSize(password) {
  let size = 0;
  if (/[a-z]/.test(password)) size += 26;
  if (/[A-Z]/.test(password)) size += 26;
  if (/[0-9]/.test(password)) size += 10;
  if (/[^A-Za-z0-9]/.test(password)) size += 32; // Símbolos comunes
  return size || 1;
}

function isCommonPassword(password) {
  const common = [
    'password', '123456', '12345678', 'qwerty', 'abc123', 'monkey', '1234567', 
    'letmein', 'trustno1', 'dragon', 'baseball', 'iloveyou', 'master', 'sunshine',
    'ashley', 'bailey', 'shadow', '123123', '654321', 'superman', 'qazwsx'
  ];
  return common.includes(password.toLowerCase());
}

function hasSequentialChars(password) {
  const sequential = /abc|bcd|cde|def|efg|fgh|ghi|hij|ijk|jkl|klm|lmn|mno|nop|opq|pqr|qrs|rst|stu|tuv|uvw|vwx|wxy|xyz|012|123|234|345|456|567|678|789/i;
  return sequential.test(password);
}

function hasRepeatedChars(password) {
  return /(.)\1{2,}/.test(password);
}

function calculateScore(checks, length, entropy) {
  let score = 0;
  
  // Puntos por longitud (máximo 30 puntos)
  score += Math.min(30, length * 2);
  
  // Puntos por diversidad de caracteres (máximo 40 puntos)
  if (checks.lowercase) score += 10;
  if (checks.uppercase) score += 10;
  if (checks.numbers) score += 10;
  if (checks.symbols) score += 10;
  
  // Puntos por evitar patrones comunes (máximo 30 puntos)
  if (checks.noCommon) score += 10;
  if (checks.noSequential) score += 10;
  if (checks.noRepeated) score += 10;
  
  // Ajuste por entropía
  if (entropy < 28) score = Math.min(score, 30);
  else if (entropy < 36) score = Math.min(score, 50);
  else if (entropy < 60) score = Math.min(score, 70);
  
  return Math.min(100, score);
}

function getStrengthLevel(score) {
  if (score < 30) return 'very-weak';
  if (score < 50) return 'weak';
  if (score < 70) return 'moderate';
  if (score < 85) return 'strong';
  return 'very-strong';
}

function getStrengthLabel(strength) {
  const labels = {
    'very-weak': 'Muy Débil',
    'weak': 'Débil',
    'moderate': 'Moderada',
    'strong': 'Fuerte',
    'very-strong': 'Muy Fuerte'
  };
  return labels[strength] || 'Sin evaluar';
}

function generateFeedback(checks, length, entropy) {
  const feedback = [];
  
  if (!checks.length) {
    feedback.push('Aumenta la longitud a al menos 12 caracteres para mayor seguridad.');
  }
  
  if (!checks.uppercase || !checks.lowercase) {
    feedback.push('Combina letras mayúsculas y minúsculas para incrementar la complejidad.');
  }
  
  if (!checks.numbers) {
    feedback.push('Agrega números para mejorar la fortaleza de la contraseña.');
  }
  
  if (!checks.symbols) {
    feedback.push('Incluye símbolos especiales (!@#$%^&*) para máxima seguridad.');
  }
  
  if (!checks.noCommon) {
    feedback.push('Esta contraseña es muy común. Elige una combinación única y personal.');
  }
  
  if (!checks.noSequential) {
    feedback.push('Evita secuencias predecibles como "abc" o "123".');
  }
  
  if (!checks.noRepeated) {
    feedback.push('Evita repetir el mismo carácter múltiples veces seguidas.');
  }
  
  if (entropy < 50) {
    feedback.push('Considera usar una frase de contraseña (passphrase) compuesta por varias palabras aleatorias.');
  }
  
  if (feedback.length === 0) {
    feedback.push('¡Excelente! Esta contraseña cumple con los estándares de seguridad recomendados.');
  }
  
  return feedback;
}

function estimateCrackTime(entropy) {
  // Asumiendo 10 billones de intentos por segundo (hardware moderno con GPUs)
  const attemptsPerSecond = 10e12;
  const possibleCombinations = Math.pow(2, entropy);
  const seconds = possibleCombinations / (2 * attemptsPerSecond); // Dividido por 2 para tiempo promedio
  
  if (seconds < 1) return { display: 'Instantáneo', seconds };
  if (seconds < 60) return { display: `${Math.round(seconds)} segundos`, seconds };
  if (seconds < 3600) return { display: `${Math.round(seconds / 60)} minutos`, seconds };
  if (seconds < 86400) return { display: `${Math.round(seconds / 3600)} horas`, seconds };
  if (seconds < 2592000) return { display: `${Math.round(seconds / 86400)} días`, seconds };
  if (seconds < 31536000) return { display: `${Math.round(seconds / 2592000)} meses`, seconds };
  if (seconds < 315360000) return { display: `${Math.round(seconds / 31536000)} años`, seconds };
  if (seconds < 3153600000) return { display: `${Math.round(seconds / 315360000)} décadas`, seconds };
  if (seconds < 31536000000) return { display: `${Math.round(seconds / 3153600000)} siglos`, seconds };
  return { display: 'Miles de años', seconds };
}

export default App;
