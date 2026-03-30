declare module 'troika-three-text' {
  import { Object3D } from 'three'

  export class Text extends Object3D {
    text: string
    font: string
    anchorX: string
    anchorY: string
    material: any
    fontSize: number
    textAlign: string
    letterSpacing: number
    lineHeight: number
    maxWidth: number
    whiteSpace: string
    sync: () => void
  }
  export function configureTextBuilder(options: { useWorker: boolean }): void
}
