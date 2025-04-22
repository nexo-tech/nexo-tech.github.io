---
date: 2025-04-21T04:14:54-08:00
draft: true
params:
  author: Oleg Pustovit
title: "Laziness in Go: Building Infinite Streams with Channels"
weight: 10
tags:
  - go
  - concurrency
  - functional-programming
---

A few days ago, I read an article about [mimicking Haskell's lazy infinite lists in Python using generators](https://unnamed.website/posts/haskelling-my-python/). It was a fun read.

Go isn't usually the first language you think of when it comes to "lazy" programming styles, but it turns out you can do quite a bit with goroutines and channels.

In this post, I'll show you how to build infinite streams in Go, with a few practical examples. No monads required.

---

## A Basic Infinite Stream

Let's start by building an infinite stream of positive integers. In Go, channels are the natural way to represent lazily computed sequences.

```go
func Ints() <-chan int {
	ch := make(chan int)
	go func() {
		for i := 1; ; i++ {
			ch <- i
		}
	}()
	return ch
}
```

You can think of `Ints()` as "yielding" numbers, just like a generator in Python.

To consume the first `n` elements:

```go
func Take(n int, ch <-chan int) []int {
	res := make([]int, 0, n)
	for i := 0; i < n; i++ {
		res = append(res, <-ch)
	}
	return res
}
```

Test it:

```go
fmt.Println(Take(10, Ints())) // [1 2 3 4 5 6 7 8 9 10]
```

---

## Mapping over Streams

Now, let's define a function that transforms a stream by applying a function to each element.

```go
func Map(f func(int) int, in <-chan int) <-chan int {
	out := make(chan int)
	go func() {
		for v := range in {
			out <- f(v)
		}
	}()
	return out
}
```

Example:

```go
squared := Map(func(x int) int { return x * x }, Ints())
fmt.Println(Take(5, squared)) // [1 4 9 16 25]
```

---

## Building a Taylor Series (e^x)

In the Python article, they define `expSeries` recursively. In Go, recursion with channels gets tricky quickly because of goroutines and the lack of memoization.

Instead, we'll build `expSeries` iteratively.

Recall the Taylor series for `e^x`:

\[
\exp(x) = 1 + x/1! + x^2/2! + x^3/3! + \dots
\]

We'll generate the sequence of terms directly.

```go
func ExpSeries(x float64) <-chan float64 {
	ch := make(chan float64)
	go func() {
		term := 1.0 // x^0 / 0! = 1
		for n := 0; ; n++ {
			ch <- term
			term *= x / float64(n+1)
		}
	}()
	return ch
}
```

And then sum the first `n` terms:

```go
func Sum(n int, ch <-chan float64) float64 {
	sum := 0.0
	for i := 0; i < n; i++ {
		sum += <-ch
	}
	return sum
}
```

Example:

```go
fmt.Println(Sum(20, ExpSeries(2)))
fmt.Println(math.Exp(2))
```

Should be close!

---

## Streams of Fibonacci Numbers

Another classic lazy list example is Fibonacci numbers.

```go
func Fibonacci() <-chan int {
	ch := make(chan int)
	go func() {
		a, b := 0, 1
		for {
			ch <- a
			a, b = b, a+b
		}
	}()
	return ch
}
```

Test it:

```go
fmt.Println(Take(10, Fibonacci())) // [0 1 1 2 3 5 8 13 21 34]
```

---

## Finding Right Triangles with a Perimeter of 24

In Haskell, you might use list comprehensions to generate all possible right triangles with sides <= 10 and perimeter 24. Let's do it in Go:

```go
package main

import "fmt"

// ints returns a stream of 1..max.
func ints(max int) <-chan int {
	out := make(chan int)
	go func() {
		defer close(out)
		for i := 1; i <= max; i++ {
			out <- i
		}
	}()
	return out
}

// flatMap takes each value from in, calls f on it to get another stream,
// and flattens all those streams into one.
func flatMap[A any, B any](in <-chan A, f func(A) <-chan B) <-chan B {
	out := make(chan B)
	go func() {
		defer close(out)
		for a := range in {
			for b := range f(a) {
				out <- b
			}
		}
	}()
	return out
}

// genTriples builds (a,b,c) with 1≤a≤b≤c≤max, via three flatMaps.
func genTriples(max int) <-chan [3]int {
	// for each c in 1..max
	return flatMap(ints(max), func(c int) <-chan [3]int {
		// for each b in 1..c
		return flatMap(ints(c), func(b int) <-chan [3]int {
			// for each a in 1..b emit [a,b,c]
			out := make(chan [3]int)
			go func() {
				defer close(out)
				for a := range ints(b) {
					out <- [3]int{a, b, c}
				}
			}()
			return out
		})
	})
}

// filterRight keeps only a²+b²==c².
func filterRight(in <-chan [3]int) <-chan [3]int {
	out := make(chan [3]int)
	go func() {
		defer close(out)
		for t := range in {
			a, b, c := t[0], t[1], t[2]
			if a*a + b*b == c*c {
				out <- t
			}
		}
	}()
	return out
}

func main() {
	for tri := range filterRight(genTriples(10)) {
		fmt.Println(tri) // prints [a b c]
	}
}
```

---

## Backpressure and Buffered Channels

One important difference between Go channels and something like Haskell's lists or Python generators is that channels *block* when nobody is reading from them. This can be good (it enforces some natural flow control) but it also means you need to think about backpressure explicitly.

If the consumer is slower than the producer, the producer will pause. If that's undesirable, you can add buffering:

```go
ch := make(chan int, 100) // buffered channel with 100 slots
```

This lets the producer get ahead a little bit, smoothing out minor hiccups in consumer speed.

---

## Memoization

Unlike Haskell's lazy lists, Go channels don't automatically memoize results. Once a value passes through a channel, it's "gone" unless you save it yourself.

If you need to remember previously generated values (for example, to allow multiple consumers to access the same computed values), you can manually build a memoized wrapper:

```go
func MemoizeStream(in <-chan int) (<-chan int, func() []int) {
	out := make(chan int)
	memo := []int{}
	go func() {
		for v := range in {
			memo = append(memo, v)
			out <- v
		}
	}()
	return out, func() []int { return memo }
}
```

Now you can keep a history of values if needed.

---

## Closing Thoughts

When I work on my projects, I usually lean on Go's strengths: simplicity, concurrency, reliability. Laziness isn't "idiomatic Go" the way it is in Haskell, but Go's primitives are flexible enough that you can borrow these ideas when they actually help.

Not everything needs to be clever. Often, the simple boring way wins.

Happy streaming!

