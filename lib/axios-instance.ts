// src/hooks/axiosInstance.ts
import axios from "axios";
import { useUserContext } from "@/hooks/use-user";
import { useRouter } from "next/compat/router";
import { useEffect, useState } from "react";

const useAxiosInstance = () => {
  const { token, clearUser } = useUserContext();
  const [isClient, setIsClient] = useState(false); // Client-side check
  const router: any = useRouter();

  useEffect(() => {
    setIsClient(true); // Set isClient to true when the component is mounted on the client side
  }, []);

  const axiosInstance = axios.create({
    baseURL: process.env.NEXT_PUBLIC_BASE_URL,
  });

  useEffect(() => {
    if (isClient) { // Ensure that the code runs only on the client
      axiosInstance.interceptors.request.use(
        (config) => {
          if (token) {
            config.headers.Authorization = `Bearer ${token}`;
          }
          return config;
        },
        (error) => {
          return Promise.reject(error);
        }
      );

      axiosInstance.interceptors.response.use(
        (response) => response,
        (error) => {
          if (error.response?.status === 401) {
            clearUser();
            router.push("/login"); // Redirect to login page
          }
          return Promise.reject(error);
        }
      );
    }
  }, [isClient, token, router, clearUser]);

  return axiosInstance;
};

export default useAxiosInstance;
