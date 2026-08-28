import { useState } from "react";
import classNames from "classnames/bind";

import useRegister from "../hooks/useRegister";

import { getFieldMessage } from "@/shared/api/api-error";
import { AppLink } from "@/shared/ui/components/app-link";
import { Button } from "@/shared/ui/components/button";

import styles from "./RegisterForm.module.scss";

const cx = classNames.bind(styles);

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

    await handleRegister(form);
  }

  return (
    <form className={cx("form")} onSubmit={onSubmit}>
      <header className={cx("header")}>
        <span className={cx("eyebrow")}>GET STARTED</span>

        <h1 className={cx("title")}>Create your account</h1>

        <p className={cx("description")}>
          Join DeutschHub and start building your German learning journey.
        </p>
      </header>

      <div className={cx("fields")}>
        <div className={cx("field")}>
          <label htmlFor="username">Username</label>

          <input
            id="username"
            name="username"
            type="text"
            placeholder="Choose a username"
            autoComplete="username"
            value={form.username}
            onChange={handleChange}
            aria-invalid={!!usernameError}
            aria-describedby={usernameError ? "username-error" : undefined}
          />

          {usernameError && (
            <p id="username-error" className={cx("error")}>
              {usernameError}
            </p>
          )}
        </div>

        <div className={cx("field")}>
          <label htmlFor="email">Email</label>

          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            autoComplete="email"
            value={form.email}
            onChange={handleChange}
            aria-invalid={!!emailError}
            aria-describedby={emailError ? "email-error" : undefined}
          />

          {emailError && (
            <p id="email-error" className={cx("error")}>
              {emailError}
            </p>
          )}
        </div>

        <div className={cx("field")}>
          <label htmlFor="password">Password</label>

          <input
            id="password"
            name="password"
            type="password"
            placeholder="Create a password"
            autoComplete="new-password"
            value={form.password}
            onChange={handleChange}
            aria-invalid={!!passwordError}
            aria-describedby={passwordError ? "password-error" : undefined}
          />

          {passwordError && (
            <p id="password-error" className={cx("error")}>
              {passwordError}
            </p>
          )}
        </div>

        <div className={cx("row")}>
          <div className={cx("field")}>
            <label htmlFor="firstName">First Name</label>

            <input
              id="firstName"
              name="firstName"
              type="text"
              placeholder="First name"
              autoComplete="given-name"
              value={form.firstName}
              onChange={handleChange}
              aria-invalid={!!firstNameError}
              aria-describedby={firstNameError ? "firstName-error" : undefined}
            />

            {firstNameError && (
              <p id="firstName-error" className={cx("error")}>
                {firstNameError}
              </p>
            )}
          </div>

          <div className={cx("field")}>
            <label htmlFor="lastName">Last Name</label>

            <input
              id="lastName"
              name="lastName"
              type="text"
              placeholder="Last name"
              autoComplete="family-name"
              value={form.lastName}
              onChange={handleChange}
              aria-invalid={!!lastNameError}
              aria-describedby={lastNameError ? "lastName-error" : undefined}
            />

            {lastNameError && (
              <p id="lastName-error" className={cx("error")}>
                {lastNameError}
              </p>
            )}
          </div>
        </div>

        <div className={cx("field")}>
          <label htmlFor="phoneNumber">Phone Number</label>

          <input
            id="phoneNumber"
            name="phoneNumber"
            type="tel"
            placeholder="Enter your phone number"
            autoComplete="tel"
            value={form.phoneNumber}
            onChange={handleChange}
            aria-invalid={!!phoneNumberError}
            aria-describedby={
              phoneNumberError ? "phoneNumber-error" : undefined
            }
          />

          {phoneNumberError && (
            <p id="phoneNumber-error" className={cx("error")}>
              {phoneNumberError}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" fullWidth>
        Create Account
      </Button>

      <div className={cx("footer")}>
        <span>Already have an account?</span>

        <AppLink to="/login">Login</AppLink>
      </div>
    </form>
  );
}
