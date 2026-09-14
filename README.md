# Juego de Arkanoid

Juego de Arkanoid (rompe-bloques) hecho con HTML, CSS y JavaScript puro, sin dependencias ni build. Totalmente jugable en el navegador.

## Cómo jugar

Abre `index.html` en un navegador, o sirve la carpeta localmente:

```
python3 -m http.server 8000
```

y visita `http://localhost:8000`.

## Controles

- **Ratón**: mover para controlar la paleta; clic para lanzar la bola o avanzar al siguiente nivel
- **Flechas**: mover la paleta
- **↑ / Espacio**: lanzar la bola, o avanzar de nivel cuando se completa uno
- **P**: pausar/reanudar
- **R**: reiniciar la partida (vuelve al nivel 1)
- **M**: silenciar/activar el sonido

## Funcionalidades

- Física de la bola con colisiones contra paleta, bloques y paredes
- 5 niveles con patrones de bloques distintos (completo, hueco central, pirámide, diamante, columnas alternadas), seleccionables libremente desde el panel de niveles
- La velocidad de la bola aumenta progresivamente con cada nivel
- Efectos de sonido (rebote y rotura de bloques) con opción de silenciar
- Animación de explosión al destruir bloques
- Marcador de puntuación, vidas y nivel actual
- Pantallas de pausa, nivel completado y juego completado

## Estado

Sin persistencia: el progreso (puntuación, nivel, vidas) se pierde al refrescar la página.

Para detalles técnicos de la arquitectura del código, ver [CLAUDE.md](CLAUDE.md).
