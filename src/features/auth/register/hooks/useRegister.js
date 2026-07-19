import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { register } from "../services/register.service";

export default function useRegister() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState(null);

  async function handleRegister(form) {
    try {
      setLoading(true);
      setError(null);

      await register(form);

      alert("Register successfully.");

      navigate("/login", {
        replace: true,
      });
    } catch (err) {
      console.error(err);

      setError(err);
    } finally {
      setLoading(false);
    }
  }

  return {
    loading,
    error,
    handleRegister,
  };
}
