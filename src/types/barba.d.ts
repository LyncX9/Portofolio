declare module '@barba/core' {
  type PreventArgs = {
    el?: Element | null
    href?: string
  }

  type Transition = {
    name?: string
    leave?: () => PromiseLike<unknown> | unknown
    enter?: () => PromiseLike<unknown> | unknown
  }

  type BarbaOptions = {
    preventRunning?: boolean
    prevent?: (args: PreventArgs) => boolean
    transitions?: Transition[]
  }

  const barba: {
    init: (options?: BarbaOptions) => void
  }

  export default barba
}
