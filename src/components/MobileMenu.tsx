'use client'

import { useState, Fragment } from 'react'
import Link from 'next/link'
import { Dialog, Transition } from '@headlessui/react'
import { Bars3Icon, XMarkIcon } from '@heroicons/react/24/outline'

export default function MobileMenu() {
    const [isOpen, setIsOpen] = useState(false)

    const closeMenu = () => setIsOpen(false)

    return (
        <div className="md:hidden">
            <button
                type="button"
                className="text-gray-700 hover:text-cyan-600 p-2"
                onClick={() => setIsOpen(true)}
                aria-label="メニューを開く"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>

            <Transition appear show={isOpen} as={Fragment}>
                <Dialog as="div" className="relative z-50" onClose={closeMenu}>
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0"
                        enterTo="opacity-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                    >
                        <div className="fixed inset-0 bg-black/25 backdrop-blur-sm" />
                    </Transition.Child>

                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-start justify-end text-center">
                            <Transition.Child
                                as={Fragment}
                                enter="transform transition ease-in-out duration-300"
                                enterFrom="translate-x-full"
                                enterTo="translate-x-0"
                                leave="transform transition ease-in-out duration-300"
                                leaveFrom="translate-x-0"
                                leaveTo="translate-x-full"
                            >
                                <Dialog.Panel className="w-full max-w-xs transform overflow-hidden bg-white p-6 text-left shadow-xl transition-all min-h-screen">
                                    <div className="flex items-center justify-between mb-8 border-b border-gray-100 pb-4">
                                        <span className="text-xl font-bold text-gray-900">Menu</span>
                                        <button
                                            type="button"
                                            className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                                            onClick={closeMenu}
                                        >
                                            <span className="sr-only">閉じる</span>
                                            <XMarkIcon className="h-6 w-6" aria-hidden="true" />
                                        </button>
                                    </div>

                                    <nav className="flex flex-col space-y-4">
                                        <Link
                                            href="/"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-gray-900 hover:text-cyan-600 py-2 border-b border-gray-50"
                                        >
                                            ホーム
                                        </Link>
                                        <Link
                                            href="/posts"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-gray-900 hover:text-cyan-600 py-2 border-b border-gray-50"
                                        >
                                            記事一覧
                                        </Link>
                                        <Link
                                            href="/tags"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-gray-900 hover:text-cyan-600 py-2 border-b border-gray-50"
                                        >
                                            タグ
                                        </Link>
                                        <Link
                                            href="/categories"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-gray-900 hover:text-cyan-600 py-2 border-b border-gray-50"
                                        >
                                            カテゴリ
                                        </Link>
                                        <Link
                                            href="/about"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-gray-900 hover:text-cyan-600 py-2 border-b border-gray-50"
                                        >
                                            About
                                        </Link>
                                        <a
                                            href="https://note.com/prorenata"
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            onClick={closeMenu}
                                            className="text-lg font-medium text-[#2cb696] hover:text-[#239178] py-2 flex items-center gap-2"
                                        >
                                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                                <path d="M17.8 2H6.2C3.9 2 2 3.9 2 6.2v11.6C2 20.1 3.9 22 6.2 22h11.6c2.3 0 4.2-1.9 4.2-4.2V6.2C22 3.9 20.1 2 17.8 2zM15 17.5h-1.5v-7h-1.5v7H10.5v-7c0-0.8 0.7-1.5 1.5-1.5h1.5c0.8 0 1.5 0.7 1.5 1.5v7z"></path>
                                            </svg>
                                            note | 白崎セラ
                                        </a>
                                    </nav>
                                </Dialog.Panel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </div>
    )
}
