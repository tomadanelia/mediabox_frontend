import React, { useState } from 'react';
import InputDemo from '@/components/shadcn-studio/input/input-01';
import InputLabelDemo from '@/components/shadcn-studio/input/input-02';
import InputStartIconDemo from '@/components/shadcn-studio/input/input-14';
import InputPasswordDemo from '@/components/shadcn-studio/input/input-26';
import CheckboxDemo from '@/components/shadcn-studio/checkbox/checkbox-01';
import InputPasswordStrengthDemo from '@/components/shadcn-studio/input/input-46';
const AuthReg: React.FC = () => {
    const [form, setForm] = useState({
        username: '',
        email: '',
        password: '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        // Handle registration logic here
        alert('Registered:\n' + JSON.stringify(form, null, 2));
    };

    return (
             <div className="mt-10 dark:bg-gray-700 bg-white rounded-sm sm:mx-auto sm:w-full sm:max-w-[480px]">
          <div className=" px-6 py-12 shadow sm:rounded-lg sm:px-12">
            <form className="space-y-6" action="#" method="POST">
              <div>

                <div className="mt-2">
                  <InputLabelDemo/>
                </div>
              </div>

              <div>
                <div className="mt-2">
                 <InputStartIconDemo/>
                </div>
              </div>
              <div>
                <div className="mt-2">
                 <InputPasswordStrengthDemo/>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CheckboxDemo/>

                </div>

                <div className="text-sm leading-6">
                  <a href="#" className="font-semibold text-indigo-600 hover:text-indigo-500">
                    Forgot password?
                  </a>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                >
                  Sign in
                </button>
              </div>
            </form>

        
          </div>

      
        </div>

    );
};

export default AuthReg;