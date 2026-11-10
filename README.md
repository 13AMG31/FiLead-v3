# Fi.Lead — paquete cloud inicial

Este paquete contiene el primer MVP cloud de Fi.Lead:
- Menú público por dirección `/[slug]`.
- Panel de administrador `/admin`.
- Alta de cuenta con Supabase Auth.
- Creación del primer negocio desde el panel.
- Alta y disponibilidad de productos.
- Registro de clientes y administración de sellos.
- Base de datos PostgreSQL con Row Level Security (RLS).

## Modo DEMO sin base de datos

Si no están configuradas `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `/admin` abre un panel de demostración con datos ficticios. Permite registrar clientes de prueba, añadir sellos, cambiar la recompensa, canjearla y modificar disponibilidad de productos. Los cambios se guardan únicamente en el almacenamiento local de este navegador, bajo una clave separada, y no se envían a Supabase. No introduzcas datos personales reales en la demo.

Para recorrer el flujo:
1. Abre `/demo` para ver el menú de ejemplo.
2. Abre `/admin` para probar la administración demo.
3. El negocio ficticio de la demo se muestra en `/la-estacion-cafe`.
4. Pulsa **Restablecer demo** para volver a los datos ficticios iniciales.

## Antes de empezar

Necesitas:
1. Windows 10/11.
2. Node.js 20.9 o superior (recomendado LTS vigente).
3. Visual Studio Code.
4. Una cuenta de Supabase.
5. Conexión a internet.

## 1. Instalar Node.js y VS Code

- Node.js: https://nodejs.org/ (descarga la versión LTS).
- Visual Studio Code: https://code.visualstudio.com/

Después de instalarlos, abre PowerShell y comprueba:

```powershell
node -v
npm -v
```

Node debe mostrar al menos `v20.9.0`.

## 2. Crear el proyecto Supabase

1. Entra a https://supabase.com/ y crea una cuenta.
2. Crea un proyecto nuevo llamado `fi-lead`.
3. Guarda la contraseña de base de datos en un gestor de contraseñas. No la pegues en el código.
4. Espera a que termine la creación.
5. En el panel del proyecto abre **SQL Editor**.
6. Pulsa **New query**.
7. Abre el archivo `supabase/schema.sql` de este paquete, copia todo su contenido y pégalo en el editor SQL.
8. Pulsa **Run**. Debe terminar sin errores.

Si el panel muestra errores, detente y copia el mensaje exacto antes de continuar.

## 3. Obtener URL y clave pública

En Supabase abre **Project Settings → API** o el diálogo **Connect** del proyecto.
Copia:
- Project URL.
- Publishable key (o la clave `anon` legacy si el panel todavía la muestra).

No uses `service_role`, `secret key` ni la contraseña de PostgreSQL en el navegador.

## 4. Abrir el proyecto en Windows

1. Descomprime `fi-lead-cloud.zip` en una carpeta fácil de encontrar, por ejemplo `Documentos\fi-lead`.
2. Abre Visual Studio Code.
3. Selecciona **File → Open Folder** y abre esa carpeta.
4. Abre **Terminal → New Terminal**.
5. Instala dependencias:

```powershell
npm install
```

## 5. Configurar la conexión

En la raíz del proyecto, crea un archivo llamado `.env.local` (no `.env.local.txt`).

Pega esto y sustituye los valores por los de TU proyecto Supabase:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROYECTO.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=TU_PUBLISHABLE_KEY
```

Guarda el archivo. No compartas `.env.local` ni lo subas a GitHub.

## 6. Ejecutar Fi.Lead

En la terminal de VS Code:

```powershell
npm run dev
```

Abre en Chrome:
- Inicio: http://localhost:3000
- Panel: http://localhost:3000/admin
- Menú demo: http://localhost:3000/demo

Para detener el servidor, vuelve a la terminal y presiona `Ctrl + C`.

## 7. Crear tu cuenta y negocio

1. Abre `http://localhost:3000/admin`.
2. En "Crear cuenta de administrador", registra tu correo y una contraseña de al menos 8 caracteres.
3. Si Supabase tiene activada la confirmación por correo, confirma el mensaje recibido y luego inicia sesión.
4. Completa el nombre del negocio y su identificador, por ejemplo `cafeteria-central`.
5. Agrega productos y precios.
6. Registra clientes de prueba y agrega sellos desde el panel.

Tu menú local será:
`http://localhost:3000/cafeteria-central`

**Importante:** `localhost` solo funciona en tu propia computadora. No grabes esa dirección en etiquetas NFC ni la entregues a clientes.

## 8. Publicar en internet (siguiente etapa)

Cuando la app funcione localmente:
1. Sube el proyecto a un repositorio privado de GitHub.
2. Importa ese repositorio en https://vercel.com/.
3. En Vercel → Project Settings → Environment Variables agrega las dos variables de `.env.local`.
4. Despliega.
5. Comprueba que el dominio público abre el menú y que el panel requiere iniciar sesión.

Después podremos conectar un dominio propio y crear las URLs definitivas para NFC y QR. No uses etiquetas reales hasta probar el dominio público y las reglas de seguridad.

## Seguridad y límites de este MVP

- La clave pública de Supabase está diseñada para aparecer en el navegador; RLS es lo que protege las tablas.
- Nunca agregues `service_role` o claves secretas a variables `NEXT_PUBLIC_*`.
- El esquema limita la administración al usuario miembro del negocio.
- El público puede leer negocios y productos disponibles. No puede consultar clientes.
- El teléfono y nombre son datos personales: usa datos ficticios durante pruebas y prepara un aviso de privacidad y consentimiento antes de registrar clientes reales.
- En esta primera versión los sellos los agrega el personal desde un panel autenticado. No permitimos que cualquier visitante se asigne sellos.
- Aún no hay control de roles por empleado, bitácora de cambios, límites antiabuso, recuperación de contraseña, importación de menú, pagos, ni copias de seguridad automatizadas.
- No es todavía un producto listo para comercializar sin una revisión de seguridad y pruebas adicionales.

## Solución de problemas

**"Faltan NEXT_PUBLIC_SUPABASE..."**
- Revisa que `.env.local` esté en la carpeta raíz, al mismo nivel que `package.json`.
- Revisa que los nombres de variables estén escritos exactamente.
- Reinicia `npm run dev` después de editar el archivo.

**"Invalid API key" o error de conexión**
- Comprueba que copiaste la Project URL y la publishable/anon key del mismo proyecto.
- No pegues espacios ni comillas alrededor de los valores.

**"relation does not exist"**
- No se ejecutó `supabase/schema.sql` o se ejecutó en otro proyecto Supabase.

**No llega el correo de confirmación**
- Revisa spam y la configuración Authentication → Providers / Email en Supabase.
- También puedes desactivar temporalmente la confirmación solo para pruebas controladas; vuelve a activarla antes de producción.

**No se puede crear el identificador**
- Usa de 3 a 50 caracteres: letras minúsculas sin acentos, números y guiones. Ejemplo: `la-estacion-cafe`.

## Próximo paquete

Tras confirmar que esta versión se instala y conecta correctamente, el siguiente paso será:
1. Mejorar diseño del menú para móvil.
2. Permitir categorías, imágenes y edición/eliminación de productos.
3. Añadir historial de sellos y canjes.
4. Añadir controles de acceso para propietarios y empleados.
5. Publicar el primer entorno en Vercel y conectar un dominio.

## Actualización v3: tarjeta por QR y equipo

Si ya habías ejecutado `supabase/schema.sql`, vuelve a ejecutarlo completo en Supabase > SQL Editor (es seguro repetirlo). Agrega el código secreto de cada cliente (`qr_token`), la tarjeta pública `/tarjeta/<código>` y el botón **Agregar socio** en `/admin`. Tu socio debe crear primero su cuenta en `/admin`; después el dueño escribe su correo en la sección **Equipo**.
