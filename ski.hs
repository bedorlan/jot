instance Show (a -> b) where
  show a = "function"

i a = a

k a b = a

s a b c = a c (b c)

plus1 x = x + 1

skiSucc = s (s (k s) k)

skiSum = s (k s) (s (k (s (k s) k)))

skiNum 0 = k i
skiNum n = skiSucc (skiNum (n - 1))

-- c1 = skiSucc c0
-- c2 = skiSucc c1
-- c3 = skiSucc c2

-- succ = S(S(K(S))(K))
-- sum = S(K(S))(S(K( S (K(S)) (K) )))
