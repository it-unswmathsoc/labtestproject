## **MATH1081 Lab Test 1 Solutions to Question Bank** 

## Mar 2026 

These solutions were written and typed by Jenny Weng and Thomas Liao. Please be ethical with this resource. It is for the use of MathSoc members - do not repost it on other forums or groups without asking for permission. If you appreciate our resources, please consider supporting us by coming to our events! Also, happy studying :) _<_ 3 

We cannot guarantee that our answers are correct (they are correct around 99.95 % of the time) - please notify us of any errors or typos at academics@unswmathsoc.org, or on our Facebook page. If there is feedback on anything else you would like to see included please let us know. There are sometimes multiple methods of solving the same question (with some methods being cleverer than others). You may also be able to leave your final answers unsimplified (however, always check your answers using the preview button next to the input box to ensure that it works out). 

©UNSW Mathematics Society 2026 

1 

## _**Question 1**_ 

In a class of 39 students: 

- 16 study Biology, 

- 21 study English, 

- 10 study both Biology and English, 

- 7 study both Biology and Maths, 

- 12 study both English and Maths, 

- 5 study all 3 subjects, and 

- 7 study none of these subjects. 

a) How many students study Maths? 

b) Writing _B, E,_ and _M_ for the sets of students studying Biology, English, and Maths respectively, evaluate _|B[c] ∪_ ( _E[c] ∩ M[c]_ ) _[c] |_ . 

## **Solutions** 

a) The inclusion exclusion principle tells us that the union of all the student subject sets is given by _|B ∪ E ∪ M |_ = _|B|_ + _|E|_ + _|M | −|B ∩ E| −|E ∩ M | −|M ∩ B|_ + _|B ∩ E ∩ M |_ . Note that _|B ∪ E ∪ M |_ is 39 _−_ 7 = 32. We substitute the provided info about the student subject sets into the above equation which leaves 

**==> picture [380 x 13] intentionally omitted <==**

## **Answer** : 19 

b) We may simplify ( _E[c] ∩ M[c]_ ) _[c]_ into ( _E ∪ M_ ) through De Morgan’s Laws, leaving us with _|B[c] ∪ E ∪ M |_ . Now consider the complement of this expression. _|_ ( _B[c] ∪ E ∪ M_ ) _[c] |_ = _|B ∩ E[c] ∩ M[c] |_ . This is the set of people who study Biology and don’t study either English or Maths. Equivalently, this represents the set of people who only study Biology. We can find the number of people studying Biology and subtract all intersections with Biology which would be 

**==> picture [326 x 12] intentionally omitted <==**

By taking the complement of this result, we find that _|B[c] ∪ E ∪ M |_ = 39 _−_ 4 = 35. **Answer** : 35 

©UNSW Mathematics Society 2026 

2 

## _**Question 2**_ 

For any integer _k_ , let _Sk_ be the set defined by: 

_Sk_ = _{n ∈_ Z :[5] 4 _[k]_[ + 2] _[ ≤][n][ ≤]_[5] 4 _[k]_[ + 12] _[}]_ a) What is _S_ 5 _− S_ 1? b) i. Find _|P_ ( _S_ 1 _× S_ 5) _|._ ii. Find _|P_ ( _S_ 1) _× P_ ( _S_ 5) _|._ c) i. Find _|P_ ( _S_ 5) _∩P_ ( _S_ 1) _|._ ii. Find _|P_ ( _S_ 5) _∪P_ ( _S_ 1) _|._ iii. Find _|P_ ( _S_ 5) _−P_ ( _S_ 1) _|._ 

Recall that the Numbas syntax for the set _{a, b, c}_ is `set(a,b,c)` . **Note:** You will only be asked one question each for b) and c) during the test. 

## **Solutions** 

a) Using the set definition, we find that the set of numbers that satisfy the inequality are the integers from 4 to 13 and 9 to 18 for _S_ 1 and _S_ 5 respectively. Recall that the set difference between two sets is the elements that are in the 1st set but not in the 2nd set. So the elements that are in _S_ 5 but not _S_ 1 are the integers from 14 to 18. 

## **Answer** : `set(14,15,16,17,18)` 

b) i) We will use the fact that _|P_ ( _S_ ) _|_ = 2 _[|][S][|]_ . Since _|A × B|_ = _|A| × |B|_ , this means _|S_ 1 _× S_ 5 _|_ equals to _|S_ 1 _| × |S_ 5 _|_ . _|S_ 1 _|_ is given by 13 - 4 + 1 = 10 and _|S_ 5 _|_ is given by 18 - 9 + 1 = 10. Hence _|S_ 1 _× S_ 5 _|_ = 10 _×_ 10 = 100 which implies 

**==> picture [102 x 14] intentionally omitted <==**

**Answer** : 2[100] 

ii) By using _|P_ ( _S_ ) _|_ = 2 _[|][S][|]_ and _|A × B|_ = _|A| × |B|_ , we see that 

**==> picture [248 x 15] intentionally omitted <==**

**Answer** : 2[20] 

©UNSW Mathematics Society 2026 

3 

c) i) We will make use of the following identity _|P_ ( _A_ ) _∩P_ ( _B_ ) _|_ = _|P_ ( _A ∩ B_ ) _|_ = 2 _[|][A][∩][B][|]_ . Thus for the following sets, we get 

**==> picture [132 x 15] intentionally omitted <==**

Since _S_ 1 _∩ S_ 5 = _{_ 9 _,_ 10 _,_ 11 _,_ 12 _,_ 13 _}_ , then _|S_ 1 _∩ S_ 5 _|_ = 5 which means _|P_ ( _S_ 1) _∩P_ ( _S_ 5) _|_ = 2[5] = 32. **Answer** : 32 

- ii) We will use the inclusion exclusion principle which leaves 

**==> picture [410 x 14] intentionally omitted <==**

## **Answer** : 2016 

iii) For _P_ ( _S_ 5) _−P_ ( _S_ 1), we are after all the subsets that are in _S_ 5 but are not a subset of _S_ 1. This corresponds to finding all the subsets of _S_ 5 and then removing the subsets that are in both _S_ 1 and _S_ 5 or 

**==> picture [322 x 14] intentionally omitted <==**

. **Answer** : 992 

©UNSW Mathematics Society 2026 

4 

## _**Question 3**_ 

Consider the function 

_f_ : R[+] 0 _[→]_[R] _[, f]_[(] _[x]_[) =] _[ x]_[(] _[x]_[ + 4)][2] 

Complete the following to make a logically true statement: Since the equation _f_ ( _x_ ) = ~~a~~ has no/exactly one/more than one solution(s) , we conclude that _f_ is injective/surjective/not injective/not surjective . ~~PO~~ 

b) Consider the function 

_g_ : R _→_ R[+] 0 _[, g]_[(] _[x]_[) =] _[ x]_[2] _[.]_ Complete the following to make a logically true statement: Since the equation _f_ ( _x_ ) = has no/exactly one/more than one solution(s) , ~~ee~~ we conclude that _f_ is injective/surjective/not injective/not surjective . ~~Po~~ 

## **Solutions** 

a) -1 (There are multiple correct answers for this). For _x_ ( _x_ + 4)[2] = _−_ 1, there are no real solutions under the given domain. Since not every element in the codomain exists in the range, we can conclude _f_ is not surjective. Choosing any negative real number results in this conclusion as well. 

**Answer** : -1, no solutions, not surjective 

b) 1 (There are multiple correct answers for this). For _x_[2] = 1, we have _x_ = _±_ 1 which means there are different values of _x_ that get mapped to the same functional value, implying _g_ cannot be injective. Choosing any real positive real number leads to the conclusion that _g_ is not injective. 

**Answer** : 1, more than one solution, not injective 

©UNSW Mathematics Society 2026 

5 

## _**Question 4**_ 

Suppose that _S_ = _{_ 0 _,_ 1 _,_ 2 _,_ 3 _,_ 4 _,_ 5 _,_ 6 _,_ 7 _}_ and that the function _f_ : _S → S_ is given by: 

**==> picture [146 x 14] intentionally omitted <==**

Let _T_ = _{_ 1 _,_ 2 _}_ . Recall that the Numbas syntax for the set _{a, b, c}_ is `set(a,b,c)` . a) What is _f_ ( _T_ )? 

b) What is _f[−]_[1] ( _T_ )? 

c) Complete the sentence: 

_f_ is (either injective or surjective) 

## **Solutions** 

a) By computing _f_ ( _x_ ) for each _x ∈ S_ , we find that 

_f_ (0) = 3 _f_ (1) = 4 _f_ (2) = 5 _f_ (3) = 6 _f_ (4) = 7 _f_ (5) = 0 _f_ (6) = 1 _f_ (7) = 2 

By using the 2nd and 3rd values, we find that 

**==> picture [70 x 13] intentionally omitted <==**

**Answer** : `set(4,5)` 

b) We need to find what values of _x ∈ S_ such that _f_ ( _x_ ) = 1 _,_ 2. From above, we clearly see that the values of _x_ corresponding to the function values of 1 and 2 are 6 and 7. Thus _f[−]_[1] ( _T_ ) = _{_ 6 _,_ 7 _}_ . 

**Answer** : `set(6,7)` 

**==> picture [189 x 14] intentionally omitted <==**

6 

c) No two unique values return the same output from above so _f_ is injective while every element in the codomain exists in the range meaning _f_ is surjective so _f_ is bijective. **Answer** : Bijective 

**==> picture [330 x 106] intentionally omitted <==**

©UNSW Mathematics Society 2026 

7 

## _**Question 5**_ 

Two positive integers _x_ and _y_ are chosen, and their GCD and LCM are found to be the following: 

**==> picture [230 x 41] intentionally omitted <==**

(a) You are told that _x_ = lcm( _x, y_ ) _._ Given only this information, what is the largest possible value of _x_ ? 

(b) You are now told that _x_ = 11088 = 2[4] _×_ 3[2] _×_ 7 _×_ 11 _._ What is the value of _y_ ? 

## **Solutions** 

(a) Both _x, y_ would have to have at least all factors of gcd( _x, y_ ). We want _x_ to be as large as possible, with _x_ = lcm( _x, y_ ) _._ An easier way to approach this question is to consider the smallest possible _y_ we can take such that _y_ = gcd( _x, y_ ), and work out _x_ accordingly. To find such _y_ , we can select the smallest additional prime factor from the lcm (i.e. 5) to add to gcd( _x, y_ ), making _y_ = 2[4] _×_ 3[2] _×_ 5 _×_ 11 = 7920 _._ Then, using the identity 

**==> picture [152 x 13] intentionally omitted <==**

we find that _x_ = 1584 _×_ 6708240 _÷_ 7920 = 2[4] _×_ 3[2] _×_ 7 _×_ 11[3] = 1341648 _._ **Answer** : 1341648 

(b) We can reapply the above identity _x × y_ = gcd( _x, y_ ) _×_ lcm( _x, y_ ) to obtain 

_y_ = 2[4] _×_ 3[2] _×_ 11 _×_ 2[4] _×_ 3[2] _×_ 5 _×_ 7 _×_ 11[3] _÷_ (2[4] _×_ 3[2] _×_ 7 _×_ 11) = 2[4] _×_ 3[2] _×_ 5 _×_ 11[3] = 958320 _._ 

**Answer** : 958320 

©UNSW Mathematics Society 2026 

8 

## _**Question 6**_ 

(When evaluating a number modulo _m_ , be sure to give your answer in its lowest nonnegative form - that is, as an element of _{_ 0 _,_ 1 _,_ 2 _, ..., m −_ 1 _}._ ) (a) Evaluate (1845 _×_ 731[535] + 730 _×_ 759[521] ) (mod 3). 

(b) Evaluate 5[46] (mod 40) _._ 

## **Solutions** 

(a) Using modular arithmetic laws, we have: 

(1845 _×_ 731[535] + 730 _×_ 759[521] ) (mod 3) 

_≡ × ×_ ((1845 mod 3) (731[535] mod 3) + (730 mod 3) (759[521] mod 3)) (mod 3) _≡_ 0 _×_ (731[535] mod 3) + 1 _×_ (759[521] mod 3) (mod 3) 

_≡_ 759[521] (mod 3) _≡_ 0[521] (mod 3) _≡_ 0 (mod 3) 

**Answer** : 0 

(b) Since 5 and 40 are small numbers and it is easy to check for 5 (mod 40) _,_ we try to look for patterns in 5 _[k]_ (mod 40) _._ 

Observe that 

**==> picture [190 x 116] intentionally omitted <==**

Clearly, 5 _[k] ≡_ 5 (mod 40) when _k_ is odd and 5 _[k] ≡_ 25 (mod 40) when _k_ is even. Therefore, 5[46] _≡_ 25 (mod 40) _._ 

**Answer** : 25 

©UNSW Mathematics Society 2026 9 

## _**Question 7**_ 

(Solve each of the following modular arithmetic equations, giving your answers as a set of all possible solutions in the given modulus.) 

   - If there are no solutions, enter `set()` . 

   - If there is one solution, say 1, enter `set(1)` . 

   - If there are multiple solutions, say 1 and 2, enter `set(1,2)` . 

- (a) Solve 101 _x ≡_ 2 (mod 132) _._ 

- (b) Solve 782 _x ≡_ 3 (mod 935) _._ 

- (c) Solve 528 _x ≡_ 6 (mod 1710) _._ 

## **Solutions** 

(a) Recall that for a congruence _px ≡ q_ (mod _m_ ), solutions exist if and only if gcd( _p, m_ ) _|q._ Let _d_ = gcd( _p, m_ ) _._ From the above, we know that if _d_ ∤ _q,_ there are no solutions. Otherwise, we divide the equation by _d_ and the equation should have _d_ solutions modulo _m._ We can find the gcd using the Euclidean algorithm, as follows: 

**==> picture [98 x 93] intentionally omitted <==**

Hence _d_ = gcd(101 _,_ 132) = 1 _,_ and there is a unique solution. We can apply the extended Euclidean algorithm to find the inverse to solve the congruence, where we aim to express 1 

©UNSW Mathematics Society 2026 

10 

as a combination of 101 and 132 _._ Working backwards from the algorithm, we have: 

**==> picture [160 x 135] intentionally omitted <==**

From this, we know that 1 _≡_ 17 _×_ 101 (mod 132) _,_ and so the inverse is 101 _[−]_[1] _≡_ 17 (mod 132) _._ To solve the original congruence, we multiply both sides by the inverse, and obtain 

**==> picture [170 x 14] intentionally omitted <==**

Hence 

**==> picture [104 x 13] intentionally omitted <==**

**Answer** : `set(34)` . 

- (b) Again, we use the Euclidean algorithm to find gcd(782 _,_ 935) first. Observe 

**==> picture [104 x 52] intentionally omitted <==**

So unlike the previous question, now we have _d_ = gcd(782 _,_ 935) = 17 _._ Clearly, _d_ ∤ 3, and so there are no solutions to this congruence. 

**Answer** : `set()` . 

- (c) Using the Euclidean algorithm (which hopefully you have mastered by now), we find that _d_ = gcd(528 _,_ 1710) = 6 _._ Since 6 _|_ 6, we should have 6 solutions at the end. First, we divide 

©UNSW Mathematics Society 2026 11 

our original congruence by 6, obtaining 

**==> picture [110 x 13] intentionally omitted <==**

then solve this congruence and repeatedly add 285 to find all 6 solutions. 

To solve the above congruence, we again find the inverse of 88 (mod 285) (by working backwards from the Euclidean algorithm) and multiply the inverse to both sides. Using Euclid, we have 

**==> picture [120 x 9] intentionally omitted <==**

And so 

**==> picture [162 x 15] intentionally omitted <==**

Therefore, the solution is 

**==> picture [110 x 12] intentionally omitted <==**

The remaining 5 solutions are in the form _x_ = 217 + 285 _k, k_ = 1 _,_ 2 _, ...,_ 5 _._ Remember to type them in a set! 

_(Usually for this question in the lab test, to examine your understanding of how to solve different congruences,_ ( _a_ ) _,_ ( _b_ ) _and_ ( _c_ ) _should encompass all three cases; however, this is not always reliable and you should always do the question properly if you have time)._ 

**Answer** : `set(217,502,787,1072,1357,1642)` . 

©UNSW Mathematics Society 2026 

12 

_**Question 8**_ 

For each of the arrow diagrams below, indicate whether they represent reflexive, symmetric, and/or transitive relations. Marks will be deducted for each incorrect selection, but the minimum possible total mark for this question is 0 _._ a 

**Solutions** Small tips for this question: if you are unsure about a particular property, just do not select them to maximise your marks. 

General rules for determining those properties: 

1. To determine reflexivity, check if every node has a loop - if any nodes are missing a loop, the relation is not reflexive, as reflexivity demands ( _x, x_ ) _∈ R_ for every element _x._ 

2. To determine symmetry, check if every arrow is double-ended - if any arrow lacks the reverse direction, it is not symmetric, as symmetry requires ( _x, y_ ) _∈ R_ = _⇒_ ( _y, x_ ) _∈ R._ 

3. To determine transitivity, look for 2-step paths. If there is an arrow from node 1 to node 2 and an arrow from node 2 to node 3, there must be an arrow from node 1 to node 3. This is because a relation is transitive only when ( _x, y_ ) _∈ R_ and ( _y, z_ ) _∈ R_ = _⇒_ ( _x, z_ ) _∈ R._ 

(a) 

Using those tips, we can see that the arrow diagram represents a relation that is reflexive (every node has a loop), symmetric (all arrows are double-headed) and transitive. 

**Answer** : Reflexive, symmetric, transitive 

©UNSW Mathematics Society 2026 

13 

(b) 

Clearly in this arrow diagram, node 3 is missing a loop, and so it is not reflexive. All existing arrows are double-headed, so it is symmetric, and there are no 2-step paths, so the relation is vacuously transitive. 

**Answer** : Not reflexive, symmetric, transitive 

(c) 

All nodes have a loop around them, so the relation is reflexive. All arrows are double-headed, so it is symmetric. For transitivity, consider the 2-step path from node 4 _−_ node 3 _−_ node 1 _._ Since there is a path from node 4 to node 3 to node 1 but no direct path from node 4 to node 1, this relation is not transitive. 

**Answer** : Reflexive, symmetric, not transitive 

©UNSW Mathematics Society 2026 

14 

(d) 

Nodes 1 _,_ 2 _,_ 3 are all missing a loop, so the relation is not reflexive. The arrow from node 1 to node 4 does not return to node 1 (and neither do other arrows), so it is not symmetric. Since all arrows are single-headed, it is easy to check all 2-step paths, and all 2-step paths have a direct 1-step route, so this relation is transitive. 

**Answer** : Not reflexive, not symmetric, transitive 

(e) 

Node 4 is missing a loop, rendering the relation not reflexive. Besides the arrow between nodes 3 and 4, all other arrows are single-headed, so the relation is not symmetric. Observe the 2-step path from node 3 to node 4, then to node 2 _._ However, there is no direct path between node 3 and node 2, and so the relation is not transitive. 

**Answer** : Not reflexive, not symmetric, not transitive 

©UNSW Mathematics Society 2026 

15 

