CREATE TABLE usuarios (
id SERIAL PRIMARY KEY,
nombre VARCHAR(50),
balance FLOAT CHECK (balance >= 0)
);
CREATE TABLE transferencias (
id SERIAL PRIMARY KEY,
emisor INT,
receptor INT,
monto FLOAT,
fecha TIMESTAMP,
FOREIGN KEY (emisor) REFERENCES usuarios(id) ON DELETE CASCADE,
FOREIGN KEY (receptor) REFERENCES usuarios(id) ON DELETE CASCADE
);


select * from usuarios
select * from transferencias
