import { useState } from "react";
import { Link } from "react-router-dom";

import useRegister from "../hooks/useRegister";

import { getFieldMessage } from "@/shared/api/api-error";

export default function RegisterForm() {
  const { handleRegister, error } = useRegister();

  const emailError = getFieldMessage(error, "email");
  const passwordError = getFieldMessage(error, "password");
  const usernameError = getFieldMessage(error, "username");
  const firstNameError = getFieldMessage(error, "firstName");
  const lastNameError = getFieldMessage(error, "lastName");
  const phoneNumberError = getFieldMessage(error, "phoneNumber");

  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    phoneNumber: "",
  });

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  }

  async function onSubmit(event) {
    event.preventDefault();

    try {
      await handleRegister(form);
    } catch {
      alert("Register failed.");
    }
  }

  return (
    <form onSubmit={onSubmit}>
      <h1>Register</h1>

      <input
        name="username"
        placeholder="Username"
        value={form.username}
        onChange={handleChange}
      />
      {usernameError && <p>{usernameError}</p>}

      <br />
      <br />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />
      {emailError && <p>{emailError}</p>}

      <br />
      <br />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />
      {passwordError && <p>{passwordError}</p>}

      <br />
      <br />

      <input
        name="firstName"
        placeholder="First Name"
        value={form.firstName}
        onChange={handleChange}
      />
      {firstNameError && <p>{firstNameError}</p>}

      <br />
      <br />

      <input
        name="lastName"
        placeholder="Last Name"
        value={form.lastName}
        onChange={handleChange}
      />
      {lastNameError && <p>{lastNameError}</p>}

      <br />
      <br />

      <input
        name="phoneNumber"
        placeholder="Phone Number"
        value={form.phoneNumber}
        onChange={handleChange}
      />
      {phoneNumberError && <p>{phoneNumberError}</p>}

      <br />
      <br />

      <button type="submit">Register</button>

      <br />
      <br />

      <Link to="/login">Already have an account? Login</Link>
    </form>
  );
}
