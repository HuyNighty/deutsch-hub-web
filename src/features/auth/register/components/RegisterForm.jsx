import { useState } from "react";
import classNames from "classnames/bind";

import {
  faArrowLeft,
  faBookOpen,
  faEnvelope,
  faEye,
  faEyeSlash,
  faGlobeEurope,
  faGraduationCap,
  faLock,
  faPhone,
  faUser,
  faUsers,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

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

  const [showPassword, setShowPassword] = useState(false);

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
    <div className={cx("register-page")}>
      <div className={cx("background")} aria-hidden="true">
        <div className={cx("background-image")} />
        <div className={cx("background-overlay")} />
        <div className={cx("background-gradient")} />
      </div>

      <div className={cx("container")}>
        <div className={cx("layout")}>
          <section className={cx("brand-section")}>
            <div className={cx("brand-content")}>
              <AppLink to="/" variant="dark" className={cx("brand")}>
                <span className={cx("brand-icon")}>
                  <FontAwesomeIcon icon={faBookOpen} />
                </span>

                <span className={cx("brand-copy")}>
                  <strong className={cx("brand-name")}>DeutschHub</strong>

                  <span className={cx("brand-tagline")}>
                    Learn. Discover. Connect.
                  </span>
                </span>
              </AppLink>

              <p className={cx("brand-description")}>
                Learn German, understand Germany, and build your future through
                one connected learning experience.
              </p>
            </div>

            <div className={cx("feature-list")}>
              <div className={cx("feature")}>
                <div className={cx("feature-icon", "learning")}>
                  <FontAwesomeIcon icon={faGraduationCap} />
                </div>

                <div className={cx("feature-copy")}>
                  <h2>Learn German</h2>

                  <p>
                    Build your German skills through structured learning and
                    meaningful practice.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "content")}>
                  <FontAwesomeIcon icon={faGlobeEurope} />
                </div>

                <div className={cx("feature-copy")}>
                  <h2>Explore Germany</h2>

                  <p>
                    Discover culture, history, places, people, and everyday life
                    beyond the language.
                  </p>
                </div>
              </div>

              <div className={cx("feature")}>
                <div className={cx("feature-icon", "communication")}>
                  <FontAwesomeIcon icon={faUsers} />
                </div>

                <div className={cx("feature-copy")}>
                  <h2>Connect with others</h2>

                  <p>
                    Share experiences and grow together with people on the same
                    journey.
                  </p>
                </div>
              </div>
            </div>

            <div className={cx("brand-footer")}>
              <span>LEARN</span>
              <span>DISCOVER</span>
              <span>CONNECT</span>
            </div>
          </section>

          <section className={cx("form-section")}>
            <div className={cx("form-card")}>
              <div className={cx("form-content")}>
                <header className={cx("form-header")}>
                  <AppLink to="/" variant="outline" className={cx("home-link")}>
                    <FontAwesomeIcon icon={faArrowLeft} />
                    <span>Home</span>
                  </AppLink>

                  <div className={cx("header-copy")}>
                    <span className={cx("eyebrow")}>JOIN DEUTSCHHUB</span>

                    <h1 className={cx("title")}>Create your account</h1>

                    <p className={cx("description")}>
                      Start learning German and exploring Germany with
                      DeutschHub.
                    </p>
                  </div>
                </header>

                {error && (
                  <div className={cx("error")} role="alert">
                    {error?.message ||
                      "Registration failed. Please check your information."}
                  </div>
                )}

                <form
                  className={cx("register-form")}
                  onSubmit={onSubmit}
                  noValidate
                >
                  <div className={cx("fields")}>
                    <div className={cx("field")}>
                      <label htmlFor="username">Username</label>

                      <div className={cx("input-wrapper")}>
                        <span className={cx("input-icon")}>
                          <FontAwesomeIcon icon={faUser} />
                        </span>

                        <input
                          id="username"
                          name="username"
                          type="text"
                          placeholder="Choose a username"
                          autoComplete="username"
                          value={form.username}
                          onChange={handleChange}
                          aria-invalid={!!usernameError}
                          aria-describedby={
                            usernameError ? "username-error" : undefined
                          }
                        />
                      </div>

                      {usernameError && (
                        <p id="username-error" className={cx("field-error")}>
                          {usernameError}
                        </p>
                      )}
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="email">Email</label>

                      <div className={cx("input-wrapper")}>
                        <span className={cx("input-icon")}>
                          <FontAwesomeIcon icon={faEnvelope} />
                        </span>

                        <input
                          id="email"
                          name="email"
                          type="email"
                          placeholder="Enter your email"
                          autoComplete="email"
                          value={form.email}
                          onChange={handleChange}
                          aria-invalid={!!emailError}
                          aria-describedby={
                            emailError ? "email-error" : undefined
                          }
                        />
                      </div>

                      {emailError && (
                        <p id="email-error" className={cx("field-error")}>
                          {emailError}
                        </p>
                      )}
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="password">Password</label>

                      <div className={cx("input-wrapper")}>
                        <span className={cx("input-icon")}>
                          <FontAwesomeIcon icon={faLock} />
                        </span>

                        <input
                          id="password"
                          name="password"
                          type={showPassword ? "text" : "password"}
                          placeholder="Create a password"
                          autoComplete="new-password"
                          value={form.password}
                          onChange={handleChange}
                          aria-invalid={!!passwordError}
                          aria-describedby={
                            passwordError ? "password-error" : undefined
                          }
                        />

                        {form.password && (
                          <button
                            type="button"
                            className={cx("password-toggle")}
                            onClick={() => setShowPassword((prev) => !prev)}
                            aria-label={
                              showPassword ? "Hide password" : "Show password"
                            }
                          >
                            <FontAwesomeIcon
                              icon={showPassword ? faEyeSlash : faEye}
                            />
                          </button>
                        )}
                      </div>

                      {passwordError && (
                        <p id="password-error" className={cx("field-error")}>
                          {passwordError}
                        </p>
                      )}
                    </div>

                    <div className={cx("row")}>
                      <div className={cx("field")}>
                        <label htmlFor="firstName">First Name</label>

                        <div className={cx("input-wrapper")}>
                          <span className={cx("input-icon")}>
                            <FontAwesomeIcon icon={faUser} />
                          </span>

                          <input
                            id="firstName"
                            name="firstName"
                            type="text"
                            placeholder="First name"
                            autoComplete="given-name"
                            value={form.firstName}
                            onChange={handleChange}
                            aria-invalid={!!firstNameError}
                            aria-describedby={
                              firstNameError ? "firstName-error" : undefined
                            }
                          />
                        </div>

                        {firstNameError && (
                          <p id="firstName-error" className={cx("field-error")}>
                            {firstNameError}
                          </p>
                        )}
                      </div>

                      <div className={cx("field")}>
                        <label htmlFor="lastName">Last Name</label>

                        <div className={cx("input-wrapper")}>
                          <span className={cx("input-icon")}>
                            <FontAwesomeIcon icon={faUser} />
                          </span>

                          <input
                            id="lastName"
                            name="lastName"
                            type="text"
                            placeholder="Last name"
                            autoComplete="family-name"
                            value={form.lastName}
                            onChange={handleChange}
                            aria-invalid={!!lastNameError}
                            aria-describedby={
                              lastNameError ? "lastName-error" : undefined
                            }
                          />
                        </div>

                        {lastNameError && (
                          <p id="lastName-error" className={cx("field-error")}>
                            {lastNameError}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className={cx("field")}>
                      <label htmlFor="phoneNumber">Phone Number</label>

                      <div className={cx("input-wrapper")}>
                        <span className={cx("input-icon")}>
                          <FontAwesomeIcon icon={faPhone} />
                        </span>

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
                      </div>

                      {phoneNumberError && (
                        <p id="phoneNumber-error" className={cx("field-error")}>
                          {phoneNumberError}
                        </p>
                      )}
                    </div>
                  </div>

                  <label className={cx("terms")}>
                    <input type="checkbox" required />

                    <span>
                      I agree to the{" "}
                      <AppLink to="/terms">Terms of Service</AppLink> and{" "}
                      <AppLink to="/privacy">Privacy Policy</AppLink>.
                    </span>
                  </label>

                  <Button type="submit" fullWidth>
                    Create Account
                    <span className={cx("button-arrow")}>→</span>
                  </Button>
                </form>

                <div className={cx("divider")}>
                  <span>OR</span>
                </div>

                <div className={cx("social-register")}>
                  <button type="button" className={cx("social-button")}>
                    <span className={cx("google-icon")}>G</span>
                    Google
                  </button>

                  <button type="button" className={cx("social-button")}>
                    <span className={cx("facebook-icon")}>f</span>
                    Facebook
                  </button>
                </div>

                <div className={cx("login")}>
                  <span>Already part of DeutschHub?</span>

                  <AppLink to="/login">Login</AppLink>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
