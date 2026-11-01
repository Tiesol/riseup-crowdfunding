-- Crear tablas base
CREATE TABLE IF NOT EXISTS country (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    code VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS role (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS person (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    password VARCHAR(100),
    is_active BOOLEAN DEFAULT FALSE,
    profile_image_url VARCHAR(255),
    description TEXT,
    birthday_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    country_id INT REFERENCES country(id),
    role_id INT REFERENCES role(id) DEFAULT 2
);

CREATE TABLE IF NOT EXISTS category (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    image_url VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS requeriment_type (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS category_requirements (
    id SERIAL PRIMARY KEY,
    requirement_name VARCHAR(255),
    is_required BOOLEAN DEFAULT TRUE,
    description VARCHAR(255),
    order_index INT,
    requirements_type_id INT REFERENCES requeriment_type(id),
    category_id INT REFERENCES category(id)
);

CREATE TABLE IF NOT EXISTS campaign_state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS workflow_state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS campaign (
    id SERIAL PRIMARY KEY,
    tittle VARCHAR(200),
    description VARCHAR(200),
    goal_amount DECIMAL DEFAULT 0,
    current_amount DECIMAL DEFAULT 0,
    expiration_date DATE,
    main_image_url VARCHAR(255),
    rich_text TEXT,
    start_date DATE,
    end_date DATE,
    view_counting INT DEFAULT 0,
    favorites_counting INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    workflow_state_id INT REFERENCES workflow_state(id) DEFAULT 1,
    campaign_state_id INT REFERENCES campaign_state(id) DEFAULT 1,
    user_id INT REFERENCES person(id),
    category_id INT REFERENCES category(id)
);

CREATE TABLE IF NOT EXISTS campaign_observations (
    id SERIAL PRIMARY KEY,
    observation_text TEXT,
    user_id INT REFERENCES person(id),
    campaign_id INT REFERENCES campaign(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS favorite (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES person(id),
    campaign_id INT REFERENCES campaign(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS donation_state (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS payment_method (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100)
);

CREATE TABLE IF NOT EXISTS donation (
    id SERIAL PRIMARY KEY,
    amount DECIMAL,
    donation_state_id INT REFERENCES donation_state(id) DEFAULT 1,
    user_id INT REFERENCES person(id),
    campaign_id INT REFERENCES campaign(id),
    payment_method_id INT REFERENCES payment_method(id),
    gateway_payment_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward (
    id SERIAL PRIMARY KEY,
    tittle VARCHAR(100),
    description TEXT,
    amount DECIMAL,
    stock INT,
    campaign_id INT REFERENCES campaign(id),
    image_url VARCHAR(500),
    created_ad TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS campaign_requirement_response (
    id SERIAL PRIMARY KEY,
    campaign_id INT REFERENCES campaign(id),
    requirement_id INT REFERENCES category_requirements(id),
    response_value TEXT,
    file_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS reward_claim (
    id SERIAL PRIMARY KEY,
    user_id INT REFERENCES person(id),
    reward_id INT REFERENCES reward(id),
    campaign_id INT REFERENCES campaign(id),
    claimed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, reward_id)
);

-- Insertar datos iniciales

-- Roles
INSERT INTO role (id, name) VALUES 
    (1, 'Administrador'),
    (2, 'Usuario')
ON CONFLICT (id) DO NOTHING;

-- Países (Lista completa)
INSERT INTO country (name, code) VALUES 
    ('Afganistán', 'AF'),
    ('Albania', 'AL'),
    ('Alemania', 'DE'),
    ('Andorra', 'AD'),
    ('Angola', 'AO'),
    ('Antigua y Barbuda', 'AG'),
    ('Arabia Saudita', 'SA'),
    ('Argelia', 'DZ'),
    ('Argentina', 'AR'),
    ('Armenia', 'AM'),
    ('Australia', 'AU'),
    ('Austria', 'AT'),
    ('Azerbaiyán', 'AZ'),
    ('Bahamas', 'BS'),
    ('Bangladés', 'BD'),
    ('Barbados', 'BB'),
    ('Baréin', 'BH'),
    ('Bélgica', 'BE'),
    ('Belice', 'BZ'),
    ('Benín', 'BJ'),
    ('Bielorrusia', 'BY'),
    ('Birmania', 'MM'),
    ('Bolivia', 'BO'),
    ('Bosnia y Herzegovina', 'BA'),
    ('Botsuana', 'BW'),
    ('Brasil', 'BR'),
    ('Brunéi', 'BN'),
    ('Bulgaria', 'BG'),
    ('Burkina Faso', 'BF'),
    ('Burundi', 'BI'),
    ('Bután', 'BT'),
    ('Cabo Verde', 'CV'),
    ('Camboya', 'KH'),
    ('Camerún', 'CM'),
    ('Canadá', 'CA'),
    ('Catar', 'QA'),
    ('Chad', 'TD'),
    ('Chile', 'CL'),
    ('China', 'CN'),
    ('Chipre', 'CY'),
    ('Colombia', 'CO'),
    ('Comoras', 'KM'),
    ('Corea del Norte', 'KP'),
    ('Corea del Sur', 'KR'),
    ('Costa de Marfil', 'CI'),
    ('Costa Rica', 'CR'),
    ('Croacia', 'HR'),
    ('Cuba', 'CU'),
    ('Dinamarca', 'DK'),
    ('Dominica', 'DM'),
    ('Ecuador', 'EC'),
    ('Egipto', 'EG'),
    ('El Salvador', 'SV'),
    ('Emiratos Árabes Unidos', 'AE'),
    ('Eritrea', 'ER'),
    ('Eslovaquia', 'SK'),
    ('Eslovenia', 'SI'),
    ('España', 'ES'),
    ('Estados Unidos', 'US'),
    ('Estonia', 'EE'),
    ('Etiopía', 'ET'),
    ('Filipinas', 'PH'),
    ('Finlandia', 'FI'),
    ('Fiyi', 'FJ'),
    ('Francia', 'FR'),
    ('Gabón', 'GA'),
    ('Gambia', 'GM'),
    ('Georgia', 'GE'),
    ('Ghana', 'GH'),
    ('Granada', 'GD'),
    ('Grecia', 'GR'),
    ('Guatemala', 'GT'),
    ('Guinea', 'GN'),
    ('Guinea Ecuatorial', 'GQ'),
    ('Guinea-Bisáu', 'GW'),
    ('Guyana', 'GY'),
    ('Haití', 'HT'),
    ('Honduras', 'HN'),
    ('Hungría', 'HU'),
    ('India', 'IN'),
    ('Indonesia', 'ID'),
    ('Irak', 'IQ'),
    ('Irán', 'IR'),
    ('Irlanda', 'IE'),
    ('Islandia', 'IS'),
    ('Islas Marshall', 'MH'),
    ('Islas Salomón', 'SB'),
    ('Israel', 'IL'),
    ('Italia', 'IT'),
    ('Jamaica', 'JM'),
    ('Japón', 'JP'),
    ('Jordania', 'JO'),
    ('Kazajistán', 'KZ'),
    ('Kenia', 'KE'),
    ('Kirguistán', 'KG'),
    ('Kiribati', 'KI'),
    ('Kuwait', 'KW'),
    ('Laos', 'LA'),
    ('Lesoto', 'LS'),
    ('Letonia', 'LV'),
    ('Líbano', 'LB'),
    ('Liberia', 'LR'),
    ('Libia', 'LY'),
    ('Liechtenstein', 'LI'),
    ('Lituania', 'LT'),
    ('Luxemburgo', 'LU'),
    ('Macedonia del Norte', 'MK'),
    ('Madagascar', 'MG'),
    ('Malasia', 'MY'),
    ('Malaui', 'MW'),
    ('Maldivas', 'MV'),
    ('Malí', 'ML'),
    ('Malta', 'MT'),
    ('Marruecos', 'MA'),
    ('Mauricio', 'MU'),
    ('Mauritania', 'MR'),
    ('México', 'MX'),
    ('Micronesia', 'FM'),
    ('Moldavia', 'MD'),
    ('Mónaco', 'MC'),
    ('Mongolia', 'MN'),
    ('Montenegro', 'ME'),
    ('Mozambique', 'MZ'),
    ('Namibia', 'NA'),
    ('Nauru', 'NR'),
    ('Nepal', 'NP'),
    ('Nicaragua', 'NI'),
    ('Níger', 'NE'),
    ('Nigeria', 'NG'),
    ('Noruega', 'NO'),
    ('Nueva Zelanda', 'NZ'),
    ('Omán', 'OM'),
    ('Países Bajos', 'NL'),
    ('Pakistán', 'PK'),
    ('Palaos', 'PW'),
    ('Panamá', 'PA'),
    ('Papúa Nueva Guinea', 'PG'),
    ('Paraguay', 'PY'),
    ('Perú', 'PE'),
    ('Polonia', 'PL'),
    ('Portugal', 'PT'),
    ('Puerto Rico', 'PR'),
    ('Reino Unido', 'GB'),
    ('República Centroafricana', 'CF'),
    ('República Checa', 'CZ'),
    ('República del Congo', 'CG'),
    ('República Democrática del Congo', 'CD'),
    ('República Dominicana', 'DO'),
    ('Ruanda', 'RW'),
    ('Rumania', 'RO'),
    ('Rusia', 'RU'),
    ('Samoa', 'WS'),
    ('San Cristóbal y Nieves', 'KN'),
    ('San Marino', 'SM'),
    ('San Vicente y las Granadinas', 'VC'),
    ('Santa Lucía', 'LC'),
    ('Santo Tomé y Príncipe', 'ST'),
    ('Senegal', 'SN'),
    ('Serbia', 'RS'),
    ('Seychelles', 'SC'),
    ('Sierra Leona', 'SL'),
    ('Singapur', 'SG'),
    ('Siria', 'SY'),
    ('Somalia', 'SO'),
    ('Sri Lanka', 'LK'),
    ('Suazilandia', 'SZ'),
    ('Sudáfrica', 'ZA'),
    ('Sudán', 'SD'),
    ('Sudán del Sur', 'SS'),
    ('Suecia', 'SE'),
    ('Suiza', 'CH'),
    ('Surinam', 'SR'),
    ('Tailandia', 'TH'),
    ('Taiwán', 'TW'),
    ('Tanzania', 'TZ'),
    ('Tayikistán', 'TJ'),
    ('Timor Oriental', 'TL'),
    ('Togo', 'TG'),
    ('Tonga', 'TO'),
    ('Trinidad y Tobago', 'TT'),
    ('Túnez', 'TN'),
    ('Turkmenistán', 'TM'),
    ('Turquía', 'TR'),
    ('Tuvalu', 'TV'),
    ('Ucrania', 'UA'),
    ('Uganda', 'UG'),
    ('Uruguay', 'UY'),
    ('Uzbekistán', 'UZ'),
    ('Vanuatu', 'VU'),
    ('Vaticano', 'VA'),
    ('Venezuela', 'VE'),
    ('Vietnam', 'VN'),
    ('Yemen', 'YE'),
    ('Yibuti', 'DJ'),
    ('Zambia', 'ZM'),
    ('Zimbabue', 'ZW')
ON CONFLICT DO NOTHING;

-- Categorías
INSERT INTO category (name, image_url) VALUES 
    ('Tecnología', '/assets/images/categories/tech.jpg'),
    ('Arte', '/assets/images/categories/art.jpg'),
    ('Música', '/assets/images/categories/music.jpg'),
    ('Cine y Video', '/assets/images/categories/film.jpg'),
    ('Juegos', '/assets/images/categories/games.jpg'),
    ('Diseño', '/assets/images/categories/design.jpg'),
    ('Fotografía', '/assets/images/categories/photo.jpg'),
    ('Moda', '/assets/images/categories/fashion.jpg'),
    ('Comida', '/assets/images/categories/food.jpg'),
    ('Causas Sociales', '/assets/images/categories/social.jpg'),
    ('Educación', '/assets/images/categories/education.jpg'),
    ('Medio Ambiente', '/assets/images/categories/environment.jpg')
ON CONFLICT DO NOTHING;

-- Tipos de requisitos
INSERT INTO requeriment_type (id, name) VALUES 
    (1, 'Texto'),
    (2, 'Archivo'),
    (3, 'Imagen'),
    (4, 'URL')
ON CONFLICT (id) DO NOTHING;

-- Estados de workflow
INSERT INTO workflow_state (id, name) VALUES 
    (1, 'Borrador'),
    (2, 'En Revisión'),
    (3, 'Observado'),
    (4, 'Rechazado'),
    (5, 'Publicado')
ON CONFLICT (id) DO NOTHING;

-- Estados de campaña
INSERT INTO campaign_state (id, name) VALUES 
    (1, 'No Iniciada'),
    (2, 'En Progreso'),
    (3, 'En Pausa'),
    (4, 'Finalizada')
ON CONFLICT (id) DO NOTHING;

-- Estados de donación
INSERT INTO donation_state (id, name) VALUES 
    (1, 'Pendiente'),
    (2, 'Completada'),
    (3, 'Cancelada'),
    (4, 'Reembolsada')
ON CONFLICT (id) DO NOTHING;

-- Métodos de pago
INSERT INTO payment_method (id, name) VALUES 
    (1, 'Tarjeta de Crédito'),
    (2, 'Tarjeta de Débito'),
    (3, 'PayPal'),
    (4, 'Transferencia Bancaria')
ON CONFLICT (id) DO NOTHING;

-- Usuario administrador por defecto
-- Password: test123 (hash bcrypt)
INSERT INTO person (first_name, last_name, email, password, is_active, role_id, country_id) VALUES 
    ('Admin', 'RiseUp', 'admin@riseup.com', '$2b$12$POCGAGOH94/oRBDY6G3CsudcFpDz6fhnjmXKLZw838tFx6Pw/YjJS', TRUE, 1, 1)
ON CONFLICT (email) DO NOTHING;

-- Usuarios de prueba
-- Password: test123
INSERT INTO person (id, first_name, last_name, email, password, is_active, role_id, country_id) VALUES 
    (2, 'Juan', 'Pérez', 'juan@test.com', '$2b$12$POCGAGOH94/oRBDY6G3CsudcFpDz6fhnjmXKLZw838tFx6Pw/YjJS', TRUE, 2, 1),
    (3, 'María', 'García', 'maria@test.com', '$2b$12$POCGAGOH94/oRBDY6G3CsudcFpDz6fhnjmXKLZw838tFx6Pw/YjJS', TRUE, 2, 1),
    (4, 'Carlos', 'López', 'carlos@test.com', '$2b$12$POCGAGOH94/oRBDY6G3CsudcFpDz6fhnjmXKLZw838tFx6Pw/YjJS', TRUE, 2, 1)
ON CONFLICT (id) DO NOTHING;

-- Campañas de ejemplo (publicadas y en progreso)
INSERT INTO campaign (id, tittle, description, rich_text, goal_amount, current_amount, start_date, expiration_date, main_image_url, user_id, category_id, workflow_state_id, campaign_state_id) VALUES 
    (1, 'EcoBot - Robot Limpiador de Playas', 
     'Robot autónomo que recolecta basura de las playas utilizando inteligencia artificial para identificar residuos.',
     '<h3>Sobre el Proyecto</h3><p>EcoBot es un robot autónomo diseñado para limpiar playas de manera eficiente. Utiliza sensores avanzados y algoritmos de IA para identificar y recolectar residuos sin dañar el ecosistema marino.</p><h3>¿Por qué es importante?</h3><p>Cada año, millones de toneladas de basura terminan en nuestros océanos. EcoBot busca ser parte de la solución.</p>',
     50000, 32500, '2025-12-01', '2026-03-15',
     'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
     2, 1, 5, 2),
    
    (2, 'App de Salud Mental para Jóvenes',
     'Aplicación móvil gratuita que ofrece recursos de salud mental, meditación guiada y conexión con profesionales.',
     '<h3>Nuestra Misión</h3><p>Queremos democratizar el acceso a recursos de salud mental para jóvenes de 15 a 25 años.</p><h3>Características</h3><ul><li>Meditaciones guiadas</li><li>Diario emocional</li><li>Chat con psicólogos</li><li>Comunidad de apoyo</li></ul>',
     25000, 18750, '2025-12-01', '2026-02-28',
     'https://images.unsplash.com/photo-1559526324-4b87b5e36e44?w=800',
     3, 1, 5, 2),
    
    (3, 'Granja Vertical Urbana',
     'Sistema de agricultura vertical para producir vegetales frescos en espacios urbanos reducidos.',
     '<h3>El Futuro de la Agricultura</h3><p>Nuestra granja vertical permite cultivar vegetales frescos en cualquier espacio urbano, reduciendo la huella de carbono del transporte de alimentos.</p>',
     75000, 45000, '2025-12-01', '2026-04-30',
     'https://images.unsplash.com/photo-1530836369250-ef72a3f5cda8?w=800',
     4, 9, 5, 2),
    
    (4, 'Documental: Voces del Amazonas',
     'Documental que cuenta las historias de las comunidades indígenas del Amazonas y su lucha por preservar la selva.',
     '<h3>Un Viaje al Corazón del Amazonas</h3><p>Durante 6 meses, viviremos con diferentes comunidades indígenas para documentar su cultura, tradiciones y la amenaza que enfrentan.</p>',
     35000, 28000, '2025-12-01', '2026-01-31',
     'https://images.unsplash.com/photo-1516026672322-bc52d61a55d5?w=800',
     2, 4, 5, 2),
    
    (5, 'Prótesis 3D Accesibles',
     'Fabricación de prótesis de mano impresas en 3D a bajo costo para personas de escasos recursos.',
     '<h3>Tecnología al Servicio de Todos</h3><p>Utilizamos impresión 3D para crear prótesis funcionales a una fracción del costo tradicional.</p><h3>Impacto</h3><p>Ya hemos ayudado a 50 personas y queremos llegar a 500 más.</p>',
     40000, 36000, '2025-12-01', '2026-02-15',
     'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800',
     3, 1, 5, 2),
    
    (6, 'Festival de Música Independiente',
     'Festival de 3 días con bandas emergentes latinoamericanas, talleres y arte urbano.',
     '<h3>Celebrando el Talento Emergente</h3><p>Queremos crear un espacio para que artistas independientes muestren su trabajo a miles de personas.</p>',
     60000, 15000, '2025-12-01', '2026-05-01',
     'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800',
     4, 3, 5, 2)
ON CONFLICT (id) DO NOTHING;

-- Recompensas de ejemplo
INSERT INTO reward (id, tittle, description, amount, stock, campaign_id, image_url) VALUES
    (1, 'Agradecimiento Digital', 'Tu nombre en nuestra página de agradecimientos', 10, 1000, 1, 'https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400'),
    (2, 'Camiseta EcoBot', 'Camiseta exclusiva del proyecto con diseño especial', 30, 200, 1, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'),
    (3, 'Adopta un EcoBot', 'Tu nombre grabado en uno de los robots + actualizaciones exclusivas', 100, 50, 1, 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=400'),
    (4, 'Suscripción Premium', '1 año de acceso premium a la app', 25, 500, 2, 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400'),
    (5, 'Kit de Cultivo', 'Kit inicial para tu propia granja vertical casera', 50, 100, 3, 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400'),
    (6, 'Premiere VIP', 'Entrada a la premiere del documental + Q&A con el director', 75, 30, 4, 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=400'),
    (7, 'Patrocinador Prótesis', 'Financias una prótesis completa para alguien necesitado', 150, 100, 5, 'https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=400'),
    (8, 'Pase VIP Festival', 'Acceso VIP los 3 días + meet & greet con artistas', 120, 50, 6, 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=400')
ON CONFLICT (id) DO NOTHING;

-- Algunas donaciones de ejemplo
INSERT INTO donation (id, amount, donation_state_id, user_id, campaign_id, payment_method_id) VALUES
    (1, 50, 2, 3, 1, 1),
    (2, 100, 2, 4, 1, 2),
    (3, 25, 2, 2, 2, 1),
    (4, 75, 2, 4, 3, 3),
    (5, 200, 2, 3, 4, 1)
ON CONFLICT (id) DO NOTHING;

-- Resetear secuencias
SELECT setval('person_id_seq', (SELECT MAX(id) FROM person));
SELECT setval('campaign_id_seq', (SELECT MAX(id) FROM campaign));
SELECT setval('reward_id_seq', (SELECT MAX(id) FROM reward));
SELECT setval('donation_id_seq', (SELECT MAX(id) FROM donation));
