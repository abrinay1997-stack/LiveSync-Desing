# 🧪 Guía de Testing - Motor Computacional LiveSync Design

## ⚠️ Prerequisito: Habilitar Ejecución de Scripts

PowerShell requiere permisos para ejecutar `npm`. Abre PowerShell **como Administrador** y ejecuta:

```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 📋 Testing Checklist - Paso a Paso

### 1️⃣ Instalación de Dependencias

Abre terminal en `LiveSync-Desing`:

```bash
cd C:\Users\MIPC\Desktop\DESARROLLOS\LIVESYNCPRO\REPO\LiveSync-Desing
npm install
```

**Verifica que instale:**
- `react` y `react-dom`
- `three` y `@react-three/fiber`
- `@react-three/drei`
- `zustand`

---

### 2️⃣ Verificación de Compilación

```bash
npm run build
# o si tienes vite
npm run type-check
```

**Resultado esperado:** ✅ Build completo sin errores TypeScript críticos

Los warnings de `Cannot find module 'react'` son normales antes de `npm install`.

---

### 3️⃣ Testing Unitario

```bash
npm test
```

**Tests esperados:**
- ✅ `catenary.test.ts` - 2 tests pasan
- ✅ `geometry.test.ts` - 4 tests pasan  
- ✅ `loadDistribution.test.ts` - 2 tests pasan

**Total: 8+ tests**

---

### 4️⃣ Iniciar Desarrollo

```bash
npm run dev
```

**Esperado:** Server en `http://localhost:5173` (Vite) o `http://localhost:3000`

---

### 5️⃣ Testing Manual en Browser

#### Escenario 1: Basic Rigging Setup
1. Abre la aplicación
2. Agrega un **Motor 1T** desde el toolbar
3. Colócalo en Y=10 (arriba)
4. Agrega un **Speaker** (cualquiera)
5. Colócalo en Y=5 (abajo)
6. **Selecciona ambos objetos** (Ctrl+Click o Box Select)

**✅ Resultado esperado:**
- Panel "Rigging Analysis" aparece en Properties Panel (derecha)
- Muestra "Total Weight", "Safety Factor", "Load per Point"
- Safety factor debería ser > 5:1 (verde)

---

#### Escenario 2: Catenary Visualization
Con los objetos seleccionados del Escenario 1:

**✅ Resultado esperado:**
- Una **línea curva** verde aparece conectando motor y speaker
- La curva representa el cable colgante (catenary)
- Color verde = baja tensión

---

#### Escenario 3: Ángulo Steep (Warning)
1. Mueve el speaker **horizontalmente lejos** del motor (X = 10)
2. Mantén ambos seleccionados

**✅ Resultado esperado:**
- Warning aparece en Rigging Analysis
- Mensaje: "Steep angle XX° increases tension by X.XXx"
- Curva catenary cambia de color a **ámbar** o **rojo**

---

#### Escenario 4: Sobrecarga
1. Agrega múltiples speakers pesados bajo un solo motor
2. Selecciona todo

**✅ Resultado esperado:**
- Utilización > 80% o > 100%
- Warning: "overloaded" o "near capacity"
- Safety factor < 5:1 (rojo)

---

### 6️⃣ Performance Check

Abre DevTools (F12) → Performance tab:

1. Selecciona 10+ objetos con rigging
2. Mueve objetos (arrastra con gizmo)
3. Verifica **FPS** (debe mantenerse ~60 fps)

**✅ Resultado esperado:**
- Cálculos del Worker NO bloquean UI
- Frame rate estable

---

### 7️⃣ Edge Cases

#### Test A: Solo Motor Seleccionado
- Selecciona solo un motor
- **Esperado:** Rigging Analysis NO aparece (no hay carga suspendida)

#### Test B: Solo Speaker Seleccionado  
- Selecciona solo un speaker
- **Esperado:** Rigging Analysis NO aparece (no hay rigging point)

#### Test C: Múltiples Motors + Múltiples Speakers
- 2 motors + 3 speakers
- **Esperado:** Cálculos distribuyen carga correctamente

---

## 🐛 Problemas Comunes y Soluciones

### Error: "Cannot find module 'react'"
**Solución:** Ejecuta `npm install` primero

### Error: Worker no responde
**Solución:** Verifica que `physics.worker.ts` esté en `/workers/`

### Error: RiggingInspector no aparece
**Solución:** 
- Verifica que seleccionaste motor + speaker
- Chequea console del browser para errores

### Catenary curves no se ven
**Solución:**
- Asegúrate que motor está ARRIBA de speaker (Y_motor > Y_speaker)
- Verifica que ambos estén seleccionados

---

## 📊 Checklist de Aprobación

Antes de continuar a Fase 3, verifica:

- [x] `npm install` completado sin errores
- [ ] Build sin errores TypeScript críticos
- [ ] Tests unitarios pasan (8+)
- [ ] Aplicación carga en browser
- [ ] Rigging Analysis panel aparece
- [ ] Safety factor se calcula correctamente
- [ ] Catenary curves se visualizan
- [ ] Warnings aparecen cuando corresponde
- [ ] Performance es aceptable (60 fps)
- [ ] Edge cases funcionan

---

## 📝 Reporte de Testing

Después de testear, completa:

**Bugs encontrados:**
- [ ] Ninguno / Listar aquí

**Mejoras necesarias:**
- [ ] Ninguna / Listar aquí

**Performance:**
- FPS promedio: ___
- Tiempo de cálculo: ___ ms

**Conclusión:**
- [ ] ✅ Aprobado para Fase 3
- [ ] ⚠️ Necesita ajustes menores
- [ ] ❌ Requiere refactoring

---

## 🚀 Siguiente Paso

Una vez que todo esté ✅:
1. Reporta resultados
2. Decidimos si proceder a Fase 3 (SPL Mapping) o hacer ajustes
