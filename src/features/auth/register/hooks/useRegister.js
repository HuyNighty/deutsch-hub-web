import { useLocation, useNavigate } from "react-router-dom";
import { register } from "../services/register.service";
import { useMutation } from "@tanstack/react-query";

export default function useRegister() {
  const navigate = useNavigate();
  const location = useLocation();

  const { mutateAsync, isPending, error } = useMutation({
    mutationFn: register,
    onSuccess() {
      alert("Đăng ký thành công!");

      navigate("/login", { replace: true, state: { returnTo: location.state?.returnTo } });
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
