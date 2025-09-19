import { useState } from 'react';
import type { ChangeEvent, FormEvent } from 'react';

type ValidationRules<T> = {
  [K in keyof T]?: (value: T[K], formData?: T) => string | '';
};

type ValidationErrors<T> = {
  [K in keyof T]?: string;
};

interface UseFormOptions<T> {
  initialValues: T;
  validationRules?: ValidationRules<T>;
  onSubmit?: (values: T) => void | Promise<void>;
}

export function useForm<T extends Record<string, any>>(options: UseFormOptions<T>) {
  const { initialValues, validationRules, onSubmit } = options;
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors<T>>({});
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as Record<keyof T, boolean>);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    // Handle checkbox inputs
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setValues({
        ...values,
        [name]: checked,
      });
    } else {
      setValues({
        ...values,
        [name]: value,
      });
    }

    // Validate field on change if it's been touched
    if (touched[name as keyof T]) {
      validateField(name as keyof T, value);
    }
  };

  const handleBlur = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Mark field as touched
    setTouched({
      ...touched,
      [name]: true,
    });

    // Validate field on blur
    validateField(name as keyof T, value);
  };

  const validateField = (fieldName: keyof T, value: any) => {
    if (!validationRules || !validationRules[fieldName]) return '';

    const validateFn = validationRules[fieldName];
    let errorMessage = '';
    
    if (validateFn) {
      errorMessage = validateFn(value, values);
    }

    setErrors(prevErrors => ({
      ...prevErrors,
      [fieldName]: errorMessage || undefined,
    }));

    return errorMessage;
  };

  const validateForm = () => {
    if (!validationRules) return true;

    const newErrors: ValidationErrors<T> = {};
    let isValid = true;

    // Mark all fields as touched
    const allTouched = Object.keys(values).reduce((acc, key) => {
      acc[key as keyof T] = true;
      return acc;
    }, {} as Record<keyof T, boolean>);
    
    setTouched(allTouched);

    // Validate all fields
    Object.keys(validationRules).forEach(key => {
      const fieldName = key as keyof T;
      const error = validateField(fieldName, values[fieldName]);
      if (error) {
        newErrors[fieldName] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  };
  
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (validateForm() && onSubmit) {
      await onSubmit(values);
    }
  };
  
  const setFieldValue = (fieldName: keyof T, value: any) => {
    setValues(prev => ({
      ...prev,
      [fieldName]: value
    }));
    
    // Validate field if it's been touched
    if (touched[fieldName]) {
      validateField(fieldName, value);
    }
  };

  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setTouched({} as Record<keyof T, boolean>);
  };

  return {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    setValues,
    setFieldValue,
    resetForm,
    validateForm,
    handleSubmit,
  };
}
