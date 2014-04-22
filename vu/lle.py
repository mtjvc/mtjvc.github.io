#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""
Base LLE class implementation using flann for nearest neighbor search and
arpack for eigenvalue computations. Linear system solving is distributed
among all available processors for some additional speed-up.

"""

__all__ = ['LLE']

import multiprocessing as mp
import numpy as np
from scipy.sparse import lil_matrix
from scipy.sparse.linalg import eigsh

try:
    import kNN_flann as knn
except ImportError:
    knn = None


class LLE(object):
    """
    Base class for performing LLE computation.

    :param data:
        Input N-dimensional data.

    :param d:
        The number of output dimensions.

    :param nn:
        The number of nearest neighbors.

    :param knnmet:
        kNN method to be used.

    :param nproc:
        The number of processors to be used. ``nproc=0`` will
        use maximum available processors.

    :param r:
        Regularization parameter.

    """

    def __init__(self, data, d, nn, knnmet='flann', nproc=0, r=0.001):

        try:
            if data.dtype != np.float32:
                self.data = np.array(data, dtype=np.float32)
            else:
                self.data = data
        except AttributeError:
            self.data = None
            raise Exception('Training data should be of numpy array dtype.')

        self.nn = nn
        self.d = d

        if nproc == 0:
            self.nproc = mp.cpu_count()
        else:
            if nproc < 1:
                self.nproc = 1
            else:
                self.nproc = nproc

        self.r = r
        self.compute_kNN = {'brute_force':
                            self._compute_kNN_brute_force}
        if knn:
            self.compute_kNN['flann'] = self._compute_kNN_flann
        else:
            knnmet = 'brute_force'

        try:
            self.compute_kNN = self.compute_kNN[knnmet]
        except KeyError:
            print 'Selected kNN method not available. ' +\
                  'Switching to brute force.'
            self.compute_kNN = self._compute_kNN_brute_force

        self.nnr = None
        self.eigenvalues = None
        self.proj = None

    def _compute_kNN_flann(self, proj=None):
        """
        Compute kNN of ``self.data`` using flann library.

        """

        if self.data is None:
            raise Exception('Missing training data.')

        nx, ny = self.data.shape
        if proj:
            self.nnr = knn.compute_knn(self.data, nx, ny, self.nn,
                                       proj, len(proj))
        else:
            self.nnr = knn.compute_knn(self.data, nx,
                                       ny, self.nn)[:, 1:]

    def _compute_kNN_brute_force(self):
        """
        Compute nearest neighbors by calculating the shortest distance for
        all data points in ``self.data``.

        """

        knn = []
        for i in range(self.data.shape[0]):
            mm = self.data - self.data[i]
            knn.append(np.argsort((mm ** 2).sum(1))[1:self.nn + 1])

        self.nnr = np.array(knn)

    def _worker(self, q, rng, id):
        """
        Worker function for solving the linear system in the inner loop.

        :param q:
            Queue object where output is stored.

        :param rng:
            Array of integer indices over which each worker will iterate.

        :param id:
            Worker's id that is appended to the output so reconstruction
            of the matrix can be made correctly.

        """

        ci = np.arange(self.nn)
        ones = np.ones(self.nn)
        ret = []

        for i in rng:
            dd = self.data[self.nnr[i]] - self.data[i]

            c = np.dot(dd, dd.T)
            c[ci, ci] += self.r * c.trace()

            w = np.linalg.solve(c, ones)
            w /= w.sum()

            ret.append(w)

        q.put((id, np.array(ret)))

    def compute(self, eigmet='arpack', weights=False, variance=False):
        """
        Main function that computes LLE projection from the trainging data
        set.

        :param eigmet:
            Method to be used for eigen vector computation. Either
            ``'arpack'`` or ``'lapack'`` can be used. First one uses
            ``scipy.sparse.eigsh()`` to get an aproximate eigenvalues
            and second one uses ``scipy.sparse.eigs()`` to get a set
            of exact eigenvalues but is slower.

        :param wights:
            weights

        :param variance:
            variance

        """

        N = self.data.shape[0]
        Nr = range(N)

        # Split the sample into eqalish sized chunks
        clens = [N / self.nproc for i in range(self.nproc)]
        for i in range(N % self.nproc):
            clens[i] += 1
        clen = np.cumsum(clens).repeat(2)
        clen = np.insert(clen, 0, 0)[:-1]
        rng = [Nr[i[0]:i[1]] for i in clen.reshape(self.nproc, 2)]

        self.compute_kNN()

        # Split the hard work among all available processors. ``id`` in
        # ``worker()`` function is needed to properly reconstruct the output.
        q = mp.Queue()
        jobs = []
        for i in range(self.nproc):
            p = mp.Process(target=self._worker, args=(q, rng[i], i))
            jobs.append(p)
            p.start()

        w = np.zeros((N, N))
        for j in jobs:
            qw = q.get()
            for i, m in zip(rng[qw[0]], qw[1]):
                w[self.nnr[i], i] = m

        w[Nr, Nr] -= 1.0
        ws = lil_matrix(w)
        ww = ws.dot(ws.T).toarray()

        if eigmet == 'lapack':
            lle = np.linalg.eigh(ww)
            self.eigenvalues = lle[0][1:]
            self.proj = lle[1][:, 1:]
        elif eigmet == 'arpack':
            self.proj = eigsh(ww, k=self.d + 1, sigma=0,
                              ncv=2 * (2 * self.d + 1))[1][:, 1:self.d + 1]
