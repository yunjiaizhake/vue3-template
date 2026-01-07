export function useToast() {
  const proxy = getCurrentInstance()?.proxy as
    | (ComponentPublicInstance & {
        $bbToast: (msg: string, pos?: 'top' | 'center' | 'bottom') => void;
      })
    | undefined;

  return (
    message: string,
    position: 'top' | 'center' | 'bottom' = 'center',
  ) => {
    proxy?.$bbToast(message, position);
  };
}
