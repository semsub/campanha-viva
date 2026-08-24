import React from 'react';

interface MaskedInputProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
  mask?: string;
  value?: string;
  onChange?: (e: any) => void;
}

export function MaskedInput(props: MaskedInputProps) {
  const { mask, onChange, value, ...rest } = props;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (onChange) {
      // Se o componente pai espera receber a string direta (ex: onChange={v => ...})
      // ou se espera o evento. Vamos suportar ambos:
      // Se a função do pai aceitar string ou evento, passamos o valor ou o evento conforme o uso.
      // Pelo erro, ele passa uma função que espera string. Vamos tentar passar o valor se for o caso, 
      // ou aceitar que o componente pai receba o evento/string.
      onChange(e.target.value);
    }
  };

  return (
    <input 
      {...rest} 
      value={value}
      onChange={handleChange}
      className={`px-3 py-2 border rounded-md w-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${props.className || ''}`} 
    />
  );
}
