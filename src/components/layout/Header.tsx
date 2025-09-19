import { useState } from 'react';
import { useAuth } from '../../store/AuthContext';
import { Menu } from '@headlessui/react';

export default function Header() {
  const { user, signOut } = useAuth();
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <header className="bg-white border-b border-lightGrey px-4 py-3 flex justify-between items-center">
      <div className="flex items-center">
        <h1 className="text-xl font-semibold text-primary md:hidden">Vô Barsi</h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <Menu as="div" className="relative">
          <Menu.Button 
            className="flex items-center space-x-2 rounded-full hover:bg-gray-100 p-1 transition-all"
            onClick={() => setIsProfileOpen(!isProfileOpen)}
          >
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
          </Menu.Button>
          
          <Menu.Items className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-1 z-10">
            <Menu.Item>
              <div className="px-4 py-2 border-b border-lightGrey">
                <p className="font-medium truncate">{user?.email}</p>
              </div>
            </Menu.Item>
            <Menu.Item>
              {({ active }) => (
                <button
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } w-full text-left px-4 py-2 text-sm text-gray-700`}
                  onClick={handleSignOut}
                >
                  Sair
                </button>
              )}
            </Menu.Item>
          </Menu.Items>
        </Menu>
      </div>
    </header>
  );
}
