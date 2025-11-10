# 🔒 CONFIGURACIÓN DE SEGURIDAD - RAILWAY & NETLIFY

## ⚠️ IMPORTANTE: Actualización de Seguridad JWT

Se ha eliminado el fallback inseguro `'secreto_por_defecto'` del código.
Ahora **JWT_SECRET es obligatorio** para que la aplicación funcione.

---

## 📋 PASOS PARA RAILWAY (Backend)

### 1. Variables de Entorno Obligatorias

Ve a tu proyecto en Railway → Settings → Variables y configura:

```
JWT_SECRET=<genera-un-secreto-seguro-aquí>
NODE_ENV=production
DATABASE_URL=<railway-lo-provee-automáticamente>
PORT=8080
```

### 2. Generar JWT_SECRET Seguro

Ejecuta en tu terminal local:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copia el resultado y úsalo como valor de `JWT_SECRET` en Railway.

### 3. Verificar Configuración

Después de configurar las variables:
1. Haz un **Redeploy manual** en Railway
2. Ve a los logs y busca: `✅ Validación de seguridad completada`
3. Si ves errores de seguridad, revisa las variables

### 4. Test de Conexión

Una vez desplegado, visita:
```
https://tu-app.railway.app/api/test
```

Debería responder: `{"message": "API funcionando correctamente"}`

---

## 📋 PASOS PARA NETLIFY (Frontend)

### 1. Variables de Entorno

Ve a tu sitio en Netlify → Site settings → Environment variables:

```
REACT_APP_API_URL=https://tu-backend.railway.app/api
```

### 2. Redeploy

Después de agregar la variable:
1. Ve a Deploys
2. Click en "Trigger deploy" → "Clear cache and deploy site"

---

## 🧪 VERIFICACIÓN POST-DESPLIEGUE

### Backend (Railway)

```bash
# Test básico
curl https://tu-backend.railway.app/api/test

# Test de login (debería fallar sin JWT_SECRET)
curl -X POST https://tu-backend.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

### Frontend (Netlify)

1. Abre tu app en el navegador
2. Intenta hacer login
3. Verifica en DevTools → Network que las peticiones van a Railway
4. Si falla, revisa que `REACT_APP_API_URL` esté correcta

---

## 🚨 ERRORES COMUNES

### "Configuración de seguridad inválida"

**Causa**: JWT_SECRET no está configurado  
**Solución**: Agrega JWT_SECRET en Railway variables

### "Not allowed by CORS"

**Causa**: La URL de Netlify no está en la lista CORS del backend  
**Solución**: El backend ya acepta `*.netlify.app` y `*.vercel.app`

### "Error interno del servidor" en login

**Causa**: DATABASE_URL no está configurada  
**Solución**: Railway debería proveerla automáticamente al agregar PostgreSQL

---

## 📝 CHECKLIST DE DESPLIEGUE

- [ ] Railway: JWT_SECRET configurado (32+ caracteres aleatorios)
- [ ] Railway: NODE_ENV=production
- [ ] Railway: DATABASE_URL presente (automático)
- [ ] Railway: Redeploy manual completado
- [ ] Railway: Logs muestran "✅ Validación de seguridad completada"
- [ ] Netlify: REACT_APP_API_URL apunta a Railway
- [ ] Netlify: Clear cache and redeploy
- [ ] Test: Login funciona desde Netlify
- [ ] Test: API responde en /api/test

---

## 🔐 MEJORES PRÁCTICAS

1. **JWT_SECRET**: Debe ser único por entorno
2. **Rotación**: Cambia JWT_SECRET cada 3-6 meses
3. **Backup**: Guarda JWT_SECRET en un gestor de contraseñas
4. **Logs**: Revisa logs de Railway regularmente
5. **HTTPS**: Siempre usa HTTPS en producción (Railway/Netlify lo hacen automático)

---

## 📞 SOPORTE

Si encuentras problemas:
1. Revisa los logs de Railway
2. Verifica las variables de entorno
3. Comprueba que el código esté en la última versión
4. Ejecuta los test de verificación arriba
