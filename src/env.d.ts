// src/env.d.ts
/// <reference types="node" />

declare namespace NodeJS {
  interface ProcessEnv {
    HTMX_SRC?: string;
    ALPINE_SRC?: string;
  }
}