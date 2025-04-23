import { useState, useEffect } from "react";

interface PackageInfo {
  id: number;
  name: string;
  label: string;
  short_description: string;
  payment_type: string;
  price: number;
  status: number;
  the_order: number;
  created_at: number;
  category: string;
  image: string;
  package_type: string;
  features: string[];
  earn_description: string;
  refer_earn: boolean;
}

const packageCache: { [key: string]: PackageInfo } = {};

export async function fetchPackageInfo(
  packageName: string
): Promise<PackageInfo> {
  if (packageCache[packageName]) {
    return packageCache[packageName];
  }

  const response = await fetch(`/api/package-info?name=${packageName}`);
  if (!response.ok) {
    throw new Error("Failed to fetch package info");
  }

  const data = await response.json();
  packageCache[packageName] = data;
  return data;
}

export function usePackageInfo(packageName: string | null) {
  const [packageInfo, setPackageInfo] = useState<PackageInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!packageName) {
      setPackageInfo(null);
      return;
    }

    setIsLoading(true);
    fetchPackageInfo(packageName)
      .then((data) => {
        setPackageInfo(data);
        setError(null);
      })
      .catch((err) => {
        setError(err);
        setPackageInfo(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [packageName]);

  return { packageInfo, isLoading, error };
}