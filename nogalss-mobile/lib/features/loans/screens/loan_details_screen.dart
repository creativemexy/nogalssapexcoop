import 'package:flutter/material.dart';

class LoanDetailsScreen extends StatelessWidget {
  final String loanId;
  
  const LoanDetailsScreen({super.key, required this.loanId});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Loan Details')),
      body: Center(child: Text('Loan Details Screen - ID: $loanId')),
    );
  }
}