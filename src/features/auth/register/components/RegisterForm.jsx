import { useState } from "react";
import { Link } from "react-router-dom";

import useRegister from "../hooks/useRegister";

export default function RegisterForm() {
  const { handleRegister } = useRegister();

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

      <br />
      <br />

      <input
        name="email"
        type="email"
        placeholder="Email"
        value={form.email}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        name="password"
        type="password"
        placeholder="Password"
        value={form.password}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        name="firstName"
        placeholder="First Name"
        value={form.firstName}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        name="lastName"
        placeholder="Last Name"
        value={form.lastName}
        onChange={handleChange}
      />

      <br />
      <br />

      <input
        name="phoneNumber"
        placeholder="Phone Number"
        value={form.phoneNumber}
        onChange={handleChange}
      />

      <br />
      <br />

      <button type="submit">Register</button>

      <br />
      <br />

      <Link to="/login">Already have an account? Login</Link>
    </form>
  );
}
