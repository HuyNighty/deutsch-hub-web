import { useNavigate } from "react-router-dom";
import { register } from "../services/register.service";
import { useMutation } from "@tanstack/react-query";

export default function useRegister() {
  const navigate = useNavigate();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: register,
    onSuccess() {
      alert("Register successfully!");

      navigate("/login", { replace: true });
    },

    onError(error) {
      console.log(error);
    },
  });

  function handleRegister(form) {
    return mutateAsync(form);
  }

  return {
    loading: isPending,
    error,
    handleRegister,
  };
}
