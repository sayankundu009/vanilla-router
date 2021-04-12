import { terser } from "rollup-plugin-terser";
import filesize from "rollup-plugin-filesize";
import { nodeResolve } from '@rollup/plugin-node-resolve';
import { liveServer } from 'rollup-plugin-live-server';

const production = !process.env.ROLLUP_WATCH;

const devOutput = {
    file: "dist/vanilla-router.js",
    format: "iife",
    plugins: [],
}

const productionOutput = {
    file: "dist/vanilla-router.min.js",
    format: "iife",
    plugins: [
        terser(),
        filesize(),
    ],
}

export default {
    input: "src/index.js",
    plugins: [
        nodeResolve(),
    
        !production && liveServer({
            port: 5000,
            host: "localhost",
            root: "./docs",
            file: "index.html",
            mount: [['/dist', './dist'], ['/src', './src']],
            open: false,
            wait: 500
        }),
    ],
    
    output: production ? [devOutput, productionOutput] : devOutput
}